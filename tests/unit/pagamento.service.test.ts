import { describe, it, expect, vi, beforeEach } from 'vitest'
vi.mock('@/shared/database/prisma.client', () => ({ prisma: { $transaction: vi.fn(), pagamento: { findMany: vi.fn(), count: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn() }, licenca: { findUnique: vi.fn(), update: vi.fn() } } }))
vi.mock('@/shared/utils/decimal', () => ({ paraNumero: vi.fn((v: unknown) => Number(v)) }))
vi.mock('@/shared/utils/licencaStatus', () => ({ calcularStatusLicenca: vi.fn() }))
import { prisma } from '../../src/shared/database/prisma.client'
import { calcularStatusLicenca } from '../../src/shared/utils/licencaStatus'
import { PagamentoService } from '../../src/modules/pagamento/pagamento.service'
import { NotFoundError, ConflictError } from '../../src/shared/errors/AppError'

const pagamento = { id: 'pag-1', empresaId: 'emp-1', licencaId: 'lic-1', valor: 1000, moeda: 'AOA', status: 'Pendente' }
const licenca = { id: 'lic-1', empresaId: 'emp-1', expiraEm: new Date('2027-01-01'), status: 'Ativa' }

describe('PagamentoService', () => {
  beforeEach(() => vi.clearAllMocks())
  it('lista pagamentos convertendo valor para número', async () => {
    vi.mocked(prisma.$transaction).mockResolvedValue([[pagamento] as never, 1] as never)
    const result = await PagamentoService.listar({ empresaId: 'emp-1', status: 'Pendente' })
    expect(result.data[0].valor).toBe(1000)
  })
  it('busca pagamento existente e converte valor', async () => {
    vi.mocked(prisma.pagamento.findUnique).mockResolvedValue(pagamento as never)
    await expect(PagamentoService.buscarPorId('pag-1')).resolves.toMatchObject({ id: 'pag-1', valor: 1000 })
  })
  it('lança erro quando pagamento não existe', async () => {
    vi.mocked(prisma.pagamento.findUnique).mockResolvedValue(null)
    await expect(PagamentoService.buscarPorId('x')).rejects.toThrow(NotFoundError)
  })
  it('impede pagamento para licença inexistente', async () => {
    vi.mocked(prisma.licenca.findUnique).mockResolvedValue(null)
    await expect(PagamentoService.criar({ empresaId: 'emp-1', licencaId: 'lic-1', valor: 1000, moeda: 'AOA' })).rejects.toThrow(NotFoundError)
  })
  it('impede pagamento de licença de outra empresa', async () => {
    vi.mocked(prisma.licenca.findUnique).mockResolvedValue({ ...licenca, empresaId: 'emp-2' } as never)
    await expect(PagamentoService.criar({ empresaId: 'emp-1', licencaId: 'lic-1', valor: 1000, moeda: 'AOA' })).rejects.toThrow(ConflictError)
  })
  it('cria pagamento válido', async () => {
    vi.mocked(prisma.licenca.findUnique).mockResolvedValue(licenca as never)
    vi.mocked(prisma.pagamento.create).mockResolvedValue(pagamento as never)
    const data = { empresaId: 'emp-1', licencaId: 'lic-1', valor: 1000, moeda: 'AOA' }
    await expect(PagamentoService.criar(data)).resolves.toMatchObject({ id: 'pag-1', valor: 1000 })
  })
  it('atualiza pagamento sem alterar licença quando não concluído', async () => {
    vi.mocked(prisma.pagamento.findUnique).mockResolvedValue(pagamento as never)
    vi.mocked(prisma.pagamento.update).mockResolvedValue({ ...pagamento, status: 'Pendente' } as never)
    await PagamentoService.atualizar('pag-1', { status: 'Pendente' })
    expect(prisma.licenca.findUnique).not.toHaveBeenCalled()
  })
  it('concluir pagamento renova licença ativa por 30 dias', async () => {
    vi.mocked(prisma.pagamento.findUnique).mockResolvedValue(pagamento as never)
    vi.mocked(prisma.pagamento.update).mockResolvedValue({ ...pagamento, status: 'Concluido' } as never)
    vi.mocked(prisma.licenca.findUnique).mockResolvedValue(licenca as never)
    vi.mocked(calcularStatusLicenca).mockReturnValue('Ativa' as never)
    await PagamentoService.atualizar('pag-1', { status: 'Concluido' })
    expect(prisma.licenca.update).toHaveBeenCalled()
    const data = vi.mocked(prisma.licenca.update).mock.calls[0][0].data as { expiraEm: Date; status: string }
    expect(data.status).toBe('Ativa')
    expect(data.expiraEm.getTime()).toBe(licenca.expiraEm.getTime() + 30 * 24 * 60 * 60 * 1000)
  })
  it('concluir pagamento activa licença expirada por 365 dias', async () => {
    vi.mocked(prisma.pagamento.findUnique).mockResolvedValue(pagamento as never)
    vi.mocked(prisma.pagamento.update).mockResolvedValue({ ...pagamento, status: 'Concluido' } as never)
    vi.mocked(prisma.licenca.findUnique).mockResolvedValue({ ...licenca, status: 'Expirada', expiraEm: new Date('2025-01-01') } as never)
    vi.mocked(calcularStatusLicenca).mockReturnValue('Expirada' as never)
    const before = Date.now()
    await PagamentoService.atualizar('pag-1', { status: 'Concluido' })
    const data = vi.mocked(prisma.licenca.update).mock.calls[0][0].data as { expiraEm: Date }
    expect(data.expiraEm.getTime()).toBeGreaterThanOrEqual(before + 365 * 24 * 60 * 60 * 1000)
  })
})
