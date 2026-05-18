// src/modules/usuario/usuario.service.ts
import { Papel, StatusUsuario } from '@prisma/client'
import { prisma }           from '@/shared/database/prisma.client'
import { NotFoundError, ConflictError, ForbiddenError } from '@/shared/errors/AppError'
import { hashSenha } from '@/shared/utils/hashSenha'
import { parsePagination, paginar } from '@/shared/utils/page'

// Select explícito — nunca retorna senhaHash
const selectSemSenha = {
  id:        true,
  email:     true,
  nome:      true,
  papel:     true,
  status:    true,
  empresaId: true,
  criadoEm:  true,
  updatedAt: true,
  empresa:   { select: { id: true, nome: true } },
} as const

export const UsuarioService = {

  async listar(query: Record<string, any>) {
    const pagination = parsePagination(query)
    const where: any = {}
    if (query.papel)     where.papel     = query.papel
    if (query.empresaId) where.empresaId = query.empresaId
    if (query.search) {
      where.OR = [
        { nome:  { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ]
    }
    const [usuarios, total] = await prisma.$transaction([
      prisma.usuario.findMany({
        where,
        skip:    pagination.skip,
        take:    pagination.take,
        orderBy: { criadoEm: 'desc' },
        select:  selectSemSenha,
      }),
      prisma.usuario.count({ where }),
    ])
    return paginar(usuarios, total, pagination)
  },

  async buscarPorId(id: string) {
    const u = await prisma.usuario.findUnique({
      where:  { id },
      select: selectSemSenha,
    })
    if (!u) throw new NotFoundError('Usuário não encontrado')
    return u
  },

  async criar(data: { email: string; nome: string; senha: string; papel: Papel; empresaId?: string }, solicitantePapel: string) {
    if (solicitantePapel === Papel.Operacional && data.papel !== Papel.Cliente) {
      throw new ForbiddenError('Operacional só pode criar usuários do tipo Cliente')
    }
    if (data.papel === Papel.Cliente && !data.empresaId) {
      throw new ConflictError('Usuário Cliente precisa de empresa vinculada')
    }
    if (await prisma.usuario.findUnique({ where: { email: data.email } })) {
      throw new ConflictError('Email já cadastrado')
    }
    if (data.empresaId && !await prisma.empresa.findUnique({ where: { id: data.empresaId } })) {
      throw new NotFoundError('Empresa não encontrada')
    }
    const { senha, ...resto } = data
    return prisma.usuario.create({
      data:   { ...resto, senhaHash: await hashSenha(senha) },
      select: selectSemSenha,
    })
  },

  async atualizar(id: string, data: { nome?: string; email?: string; status?: string }) {
    await UsuarioService.buscarPorId(id)
    if (data.email) {
      if (await prisma.usuario.findFirst({ where: { email: data.email, NOT: { id } } })) {
        throw new ConflictError('Email já em uso')
      }
    }
    // Cast explícito para satisfazer o Prisma
    const updateData: any = { ...data }
    return prisma.usuario.update({
      where:  { id },
      data:   updateData,
      select: selectSemSenha,
    })
  },

  async desativar(id: string) {
    await UsuarioService.buscarPorId(id)
    return prisma.usuario.update({
      where:  { id },
      data:   { status: StatusUsuario.Inativo },
      select: selectSemSenha,
    })
  },

  async buscarPorEmailComSenha(email: string) {
    return prisma.usuario.findUnique({ where: { email } })
  },
}