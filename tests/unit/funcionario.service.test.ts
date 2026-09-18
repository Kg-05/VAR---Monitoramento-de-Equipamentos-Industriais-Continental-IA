import { describe, it, expect, vi, beforeEach } from 'vitest'
vi.mock('@/shared/database/prisma.client', () => ({ prisma: { $transaction: vi.fn(), funcionario: { findMany: vi.fn(), count: vi.fn(), findUnique: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn() } } }))
vi.mock('@/modules/licenca/licenca.service', () => ({ LicencaService: { verificarLimiteFuncionarios: vi.fn() } }))
import { prisma } from '../../src/shared/database/prisma.client'
import { LicencaService } from '../../src/modules/licenca/licenca.service'
import { FuncionarioService } from '../../src/modules/funcionario/funcionario.service'
import { NotFoundError, ConflictError } from '../../src/shared/errors/AppError'

const funcionario = { id: 'f-1', empresaId: 'emp-1', nome: 'Ana', email: 'ana@empresa.ao', cargo: 'Operadora', telefone: '900000000', status: 'Ativo' }

describe('FuncionarioService', () => {
  beforeEach(() => vi.clearAllMocks())
  it('lista funcionários com filtros', async () => {
    vi.mocked(prisma.$transaction).mockResolvedValue([[funcionario] as never, 1] as never)
    const result = await FuncionarioService.listar({ empresaId: 'emp-1', status: 'Ativo', search: 'ana' })
    expect(result.data).toEqual([funcionario])
  })
  it('busca por id respeitando empresa', async () => {
    vi.mocked(prisma.funcionario.findUnique).mockResolvedValue(funcionario as never)
    await expect(FuncionarioService.buscarPorId('f-1', 'emp-1')).resolves.toEqual(funcionario)
    await expect(FuncionarioService.buscarPorId('f-1', 'emp-2')).rejects.toThrow(NotFoundError)
  })
  it('cria funcionário após verificar limite da licença', async () => {
    vi.mocked(LicencaService.verificarLimiteFuncionarios).mockResolvedValue(undefined)
    vi.mocked(prisma.funcionario.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.funcionario.create).mockResolvedValue(funcionario as never)
    await FuncionarioService.criar({ empresaId: 'emp-1', nome: 'Ana', email: funcionario.email, cargo: funcionario.cargo })
    expect(LicencaService.verificarLimiteFuncionarios).toHaveBeenCalledWith('emp-1')
    expect(prisma.funcionario.create).toHaveBeenCalled()
  })
  it('propaga bloqueio quando email já existe na empresa', async () => {
    vi.mocked(LicencaService.verificarLimiteFuncionarios).mockResolvedValue(undefined)
    vi.mocked(prisma.funcionario.findFirst).mockResolvedValue(funcionario as never)
    await expect(FuncionarioService.criar({ empresaId: 'emp-1', nome: 'Outra', email: funcionario.email, cargo: 'X' })).rejects.toThrow(ConflictError)
  })
  it('atualiza funcionário e impede email duplicado', async () => {
    vi.mocked(prisma.funcionario.findUnique).mockResolvedValue(funcionario as never)
    vi.mocked(prisma.funcionario.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.funcionario.update).mockResolvedValue({ ...funcionario, nome: 'Maria' } as never)
    await FuncionarioService.atualizar('f-1', { nome: 'Maria', email: 'maria@ao' }, 'emp-1')
    expect(prisma.funcionario.update).toHaveBeenCalledWith({ where: { id: 'f-1' }, data: { nome: 'Maria', email: 'maria@ao' } })
  })
  it('desativa funcionário respeitando empresa', async () => {
    vi.mocked(prisma.funcionario.findUnique).mockResolvedValue(funcionario as never)
    vi.mocked(prisma.funcionario.update).mockResolvedValue({ ...funcionario, status: 'Inativo' } as never)
    await FuncionarioService.desativar('f-1', 'emp-1')
    expect(prisma.funcionario.update).toHaveBeenCalledWith({ where: { id: 'f-1' }, data: { status: 'Inativo' } })
  })
})
