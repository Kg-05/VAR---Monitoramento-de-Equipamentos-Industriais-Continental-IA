import { describe, it, expect, vi, beforeEach } from 'vitest'
vi.mock('@/shared/database/prisma.client', () => ({ prisma: {
  $transaction: vi.fn(), empresa: { findMany: vi.fn(), count: vi.fn(), findUnique: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn() }, alerta: { count: vi.fn(), groupBy: vi.fn() },
} }))
import { prisma } from '../../src/shared/database/prisma.client'
import { EmpresaService } from '../../src/modules/empresa/empresa.service'
import { NotFoundError, ConflictError } from '../../src/shared/errors/AppError'

const empresa = { id: 'emp-1', nome: 'Empresa A', cnpj: '123', email: 'a@empresa.ao', telefone: '900000000', status: 'Ativo' }

describe('EmpresaService', () => {
  beforeEach(() => vi.clearAllMocks())
  it('lista empresas com filtros de status e pesquisa', async () => {
    vi.mocked(prisma.$transaction).mockResolvedValue([[empresa] as never, 1] as never)
    const result = await EmpresaService.listar({ status: 'Inativo', search: 'Empresa', page: 1, limit: 10 })
    expect(result.data).toEqual([empresa])
    expect(prisma.$transaction).toHaveBeenCalled()
  })
  it('busca empresa existente', async () => {
    vi.mocked(prisma.empresa.findUnique).mockResolvedValue(empresa as never)
    await expect(EmpresaService.buscarPorId('emp-1')).resolves.toEqual(empresa)
  })
  it('lança erro para empresa inexistente', async () => {
    vi.mocked(prisma.empresa.findUnique).mockResolvedValue(null)
    await expect(EmpresaService.buscarPorId('x')).rejects.toThrow(NotFoundError)
  })
  it('impede CNPJ duplicado', async () => {
    vi.mocked(prisma.empresa.findUnique).mockResolvedValue(empresa as never)
    await expect(EmpresaService.criar({ nome: 'B', cnpj: '123', email: 'b@ao' })).rejects.toThrow(ConflictError)
    expect(prisma.empresa.create).not.toHaveBeenCalled()
  })
  it('impede email duplicado', async () => {
    vi.mocked(prisma.empresa.findUnique).mockResolvedValueOnce(null).mockResolvedValueOnce(empresa as never)
    await expect(EmpresaService.criar({ nome: 'B', cnpj: '456', email: empresa.email })).rejects.toThrow(ConflictError)
  })
  it('cria empresa quando CNPJ e email estão disponíveis', async () => {
    vi.mocked(prisma.empresa.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.empresa.create).mockResolvedValue(empresa as never)
    const data = { nome: empresa.nome, cnpj: empresa.cnpj, email: empresa.email }
    await expect(EmpresaService.criar(data)).resolves.toEqual(empresa)
    expect(prisma.empresa.create).toHaveBeenCalledWith({ data })
  })
  it('atualiza empresa e verifica email duplicado', async () => {
    vi.mocked(prisma.empresa.findUnique).mockResolvedValue(empresa as never)
    vi.mocked(prisma.empresa.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.empresa.update).mockResolvedValue({ ...empresa, nome: 'Nova' } as never)
    await EmpresaService.atualizar('emp-1', { nome: 'Nova', email: 'novo@ao' })
    expect(prisma.empresa.update).toHaveBeenCalledWith({ where: { id: 'emp-1' }, data: { nome: 'Nova', email: 'novo@ao' } })
  })
  it('desativa e ativa empresa', async () => {
    vi.mocked(prisma.empresa.findUnique).mockResolvedValue(empresa as never)
    vi.mocked(prisma.empresa.update).mockResolvedValue(empresa as never)
    await EmpresaService.desativar('emp-1')
    expect(prisma.empresa.update).toHaveBeenLastCalledWith({ where: { id: 'emp-1' }, data: { status: 'Inativo' } })
    await EmpresaService.ativar('emp-1')
    expect(prisma.empresa.update).toHaveBeenLastCalledWith({ where: { id: 'emp-1' }, data: { status: 'Ativo' } })
  })
  it('gera resumo do dashboard', async () => {
    const rows = [{ ...empresa, licencas: [{ plano: 'Premium', status: 'Ativa' }], pagamentos: [{ valor: 1000, status: 'Concluido' }, { valor: 200, status: 'Pendente' }] }]
    vi.mocked(prisma.$transaction).mockResolvedValue([3, 2, 1, 5, 2, [{ nivel: 'critico', _count: 2 }], rows] as never)
    const result = await EmpresaService.resumoDashboard()
    expect(result.cards).toEqual({ totalEmpresas: 3, empresasAtivas: 2, empresasInativas: 1, empresasSuspensas: 1 })
    expect(result.alertas.porNivel).toEqual(expect.objectContaining({ critico: 2 }))
    expect(result.tabela[0]).toMatchObject({ empresa: empresa.nome, licencaVendida: 1, status: 'Ativa' })
    expect(
  result.tabela[0].totalPago.replace(/\s+/g, ' ').trim()
).toBe('1 000,00 AOA')
  })
})
