import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Papel } from '@prisma/client'
vi.mock('@/shared/database/prisma.client', () => ({ prisma: { $transaction: vi.fn(), usuario: { findMany: vi.fn(), count: vi.fn(), findUnique: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn() }, empresa: { findUnique: vi.fn() } } }))
vi.mock('@/shared/utils/hashSenha', () => ({ hashSenha: vi.fn(async (senha: string) => `hash:${senha}`) }))
import { prisma } from '../../src/shared/database/prisma.client'
import { hashSenha } from '../../src/shared/utils/hashSenha'
import { UsuarioService } from '../../src/modules/usuario/usuario.service'
import { NotFoundError, ConflictError, ForbiddenError } from '../../src/shared/errors/AppError'

const usuario = { id: 'u-1', email: 'user@ao', nome: 'User', papel: Papel.Cliente, status: 'Ativo', empresaId: 'emp-1', criadoEm: new Date(), updatedAt: new Date(), empresa: { id: 'emp-1', nome: 'Empresa A' } }

describe('UsuarioService', () => {
  beforeEach(() => vi.clearAllMocks())
  it('lista usuários sem senha', async () => {
    vi.mocked(prisma.$transaction).mockResolvedValue([[usuario] as never, 1] as never)
    const result = await UsuarioService.listar({ papel: Papel.Cliente, empresaId: 'emp-1', search: 'user' })
    expect(result.data[0]).toEqual(usuario)
    expect(result.data[0]).not.toHaveProperty('senhaHash')
  })
  it('busca usuário por id', async () => {
    vi.mocked(prisma.usuario.findUnique).mockResolvedValue(usuario as never)
    await expect(UsuarioService.buscarPorId('u-1')).resolves.toEqual(usuario)
  })
  it('lança erro quando usuário não existe', async () => {
    vi.mocked(prisma.usuario.findUnique).mockResolvedValue(null)
    await expect(UsuarioService.buscarPorId('x')).rejects.toThrow(NotFoundError)
  })
  it('impede Operacional de criar usuário que não seja Cliente', async () => {
    await expect(UsuarioService.criar({ email: 'a@ao', nome: 'A', senha: '123', papel: Papel.ADM }, Papel.Operacional)).rejects.toThrow(ForbiddenError)
  })
  it('exige empresa para usuário Cliente', async () => {
    await expect(UsuarioService.criar({ email: 'a@ao', nome: 'A', senha: '123', papel: Papel.Cliente }, Papel.ADM)).rejects.toThrow(ConflictError)
  })
  it('impede email duplicado', async () => {
    vi.mocked(prisma.usuario.findUnique).mockResolvedValue(usuario as never)
    await expect(UsuarioService.criar({ email: usuario.email, nome: 'A', senha: '123', papel: Papel.Cliente, empresaId: 'emp-1' }, Papel.ADM)).rejects.toThrow(ConflictError)
  })
  it('impede empresa inexistente', async () => {
    vi.mocked(prisma.usuario.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.empresa.findUnique).mockResolvedValue(null)
    await expect(UsuarioService.criar({ email: 'a@ao', nome: 'A', senha: '123', papel: Papel.Cliente, empresaId: 'emp-1' }, Papel.ADM)).rejects.toThrow(NotFoundError)
  })
  it('cria usuário usando senhaHash e não senha', async () => {
    vi.mocked(prisma.usuario.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.empresa.findUnique).mockResolvedValue({ id: 'emp-1' } as never)
    vi.mocked(prisma.usuario.create).mockResolvedValue(usuario as never)
    await UsuarioService.criar({ email: 'a@ao', nome: 'A', senha: '123', papel: Papel.Cliente, empresaId: 'emp-1' }, Papel.ADM)
    expect(hashSenha).toHaveBeenCalledWith('123')
    expect(prisma.usuario.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ senhaHash: 'hash:123' }) }))
    const call = vi.mocked(prisma.usuario.create).mock.calls[0][0]
    expect(call.data).not.toHaveProperty('senha')
  })
  it('atualiza usuário e verifica email duplicado', async () => {
    vi.mocked(prisma.usuario.findUnique).mockResolvedValue(usuario as never)
    vi.mocked(prisma.usuario.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.usuario.update).mockResolvedValue(usuario as never)
    await UsuarioService.atualizar('u-1', { nome: 'Novo', email: 'novo@ao' })
    expect(prisma.usuario.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'u-1' }, data: { nome: 'Novo', email: 'novo@ao' } }))
  })
  it('desativa usuário', async () => {
    vi.mocked(prisma.usuario.findUnique).mockResolvedValue(usuario as never)
    vi.mocked(prisma.usuario.update).mockResolvedValue({ ...usuario, status: 'Inativo' } as never)
    await UsuarioService.desativar('u-1')
    expect(prisma.usuario.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'u-1' }, data: { status: 'Inativo' } }))
  })
  it('busca usuário por email com senha', async () => {
    vi.mocked(prisma.usuario.findUnique).mockResolvedValue({ ...usuario, senhaHash: 'hash' } as never)
    await expect(UsuarioService.buscarPorEmailComSenha(usuario.email)).resolves.toHaveProperty('senhaHash', 'hash')
  })
})
