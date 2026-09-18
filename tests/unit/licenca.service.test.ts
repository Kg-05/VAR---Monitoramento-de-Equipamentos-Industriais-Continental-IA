import { describe, it, expect, vi, beforeEach } from 'vitest'
vi.mock('@/shared/database/prisma.client', () => ({ prisma: { $transaction: vi.fn(), licenca: { findMany: vi.fn(), count: vi.fn(), findUnique: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn() }, empresa: { findUnique: vi.fn() }, funcionario: { count: vi.fn() } } }))
vi.mock('@/shared/utils/licencaStatus', () => ({ calcularStatusLicenca: vi.fn(), diasParaExpirar: vi.fn() }))
import { prisma } from '../../src/shared/database/prisma.client'
import { calcularStatusLicenca, diasParaExpirar } from '../../src/shared/utils/licencaStatus'
import { LicencaService } from '../../src/modules/licenca/licenca.service'
import { NotFoundError, ConflictError, LicencaInvalidaError } from '../../src/shared/errors/AppError'

const base = { id: 'lic-1', empresaId: 'emp-1', plano: 'Premium', maxDeFuncionarios: 10, inicioEm: new Date('2026-01-01'), expiraEm: new Date('2027-01-01'), status: 'Ativa' }

describe('LicencaService', () => {
  beforeEach(() => { vi.clearAllMocks(); vi.mocked(calcularStatusLicenca).mockReturnValue('Ativa' as never); vi.mocked(diasParaExpirar).mockReturnValue(20) })
  it('lista licenças e calcula status/dias', async () => {
    vi.mocked(prisma.$transaction).mockResolvedValue([[base] as never, 1] as never)
    const result = await LicencaService.listar({ empresaId: 'emp-1' })
    expect(result.data[0]).toMatchObject({ statusCalculado: 'Ativa', diasRestantes: 20 })
  })
  it('filtra status calculado quando solicitado', async () => {
    vi.mocked(prisma.$transaction).mockResolvedValue([[base] as never, 1] as never)
    vi.mocked(calcularStatusLicenca).mockReturnValue('Expirada' as never)
    const result = await LicencaService.listar({ status: 'Ativa' })
    expect(result.data).toEqual([])
  })
  it('busca licença existente', async () => {
    vi.mocked(prisma.licenca.findUnique).mockResolvedValue(base as never)
    await expect(LicencaService.buscarPorId('lic-1')).resolves.toMatchObject({ id: 'lic-1', statusCalculado: 'Ativa' })
  })
  it('lança erro para licença inexistente', async () => {
    vi.mocked(prisma.licenca.findUnique).mockResolvedValue(null)
    await expect(LicencaService.buscarPorId('x')).rejects.toThrow(NotFoundError)
  })
  it('retorna licença ativa por empresa', async () => {
    vi.mocked(prisma.licenca.findFirst).mockResolvedValue(base as never)
    await expect(LicencaService.buscarAtivaPorEmpresa('emp-1')).resolves.toMatchObject({ id: 'lic-1', statusCalculado: 'Ativa' })
  })
  it('retorna null quando não há licença ativa', async () => {
    vi.mocked(prisma.licenca.findFirst).mockResolvedValue(null)
    await expect(LicencaService.buscarAtivaPorEmpresa('emp-1')).resolves.toBeNull()
  })
  it('não cria licença para empresa inexistente', async () => {
    vi.mocked(prisma.empresa.findUnique).mockResolvedValue(null)
    await expect(LicencaService.criar({ empresaId: 'emp-1', plano: 'Premium', maxDeFuncionarios: 10, inicioEm: new Date('2026-01-01'), expiraEm: new Date('2027-01-01') })).rejects.toThrow(NotFoundError)
  })
  it('impede datas de licença inválidas', async () => {
    vi.mocked(prisma.empresa.findUnique).mockResolvedValue({ id: 'emp-1' } as never)
    await expect(LicencaService.criar({ empresaId: 'emp-1', plano: 'Premium', maxDeFuncionarios: 10, inicioEm: new Date('2027-01-01'), expiraEm: new Date('2026-01-01') })).rejects.toThrow(ConflictError)
  })
  it('cria licença válida', async () => {
    vi.mocked(prisma.empresa.findUnique).mockResolvedValue({ id: 'emp-1' } as never)
    vi.mocked(prisma.licenca.create).mockResolvedValue(base as never)
    const data = { empresaId: 'emp-1', plano: 'Premium' as const, maxDeFuncionarios: 10, inicioEm: new Date('2026-01-01'), expiraEm: new Date('2027-01-01') }
    await expect(LicencaService.criar(data)).resolves.toEqual(base)
  })
  it('verifica limite de funcionários da licença', async () => {
    vi.mocked(prisma.licenca.findFirst).mockResolvedValue(base as never)
    vi.mocked(prisma.funcionario.count).mockResolvedValue(10)
    await expect(LicencaService.verificarLimiteFuncionarios('emp-1')).rejects.toThrow(ConflictError)
    vi.mocked(prisma.funcionario.count).mockResolvedValue(9)
    await expect(LicencaService.verificarLimiteFuncionarios('emp-1')).resolves.toBeUndefined()
  })
  it('lança erro quando empresa não possui licença válida', async () => {
    vi.mocked(prisma.licenca.findFirst).mockResolvedValue(null)
    await expect(LicencaService.verificarLimiteFuncionarios('emp-1')).rejects.toThrow(LicencaInvalidaError)
  })
})
