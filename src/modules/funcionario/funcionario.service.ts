import { StatusFuncionario, Prisma } from '@prisma/client'
import { prisma }           from '@/shared/database/prisma.client'
import { NotFoundError, ConflictError } from '@/shared/errors/AppError'
import { parsePagination, paginar }     from '@/shared/utils/page'
import { LicencaService }  from '@/modules/licenca/licenca.service'

export const FuncionarioService = {
  async listar(query: Record<string, unknown>) {
    const pagination = parsePagination(query)
    const where: Prisma.FuncionarioWhereInput = {
      ...(query.empresaId && { empresaId: query.empresaId as string }),
      ...(query.status    && { status:    query.status as StatusFuncionario }),
      ...(query.search    && { OR: [
        { nome:  { contains: query.search as string, mode: 'insensitive' } },
        { email: { contains: query.search as string, mode: 'insensitive' } },
        { cargo: { contains: query.search as string, mode: 'insensitive' } },
      ]}),
    }
    const [funcionarios, total] = await prisma.$transaction([
      prisma.funcionario.findMany({ where, skip: pagination.skip, take: pagination.take, orderBy: { criadoEm: 'desc' }, include: { empresa: { select: { id: true, nome: true } } } }),
      prisma.funcionario.count({ where }),
    ])
    return paginar(funcionarios, total, pagination)
  },

  async buscarPorId(id: string, empresaId?: string) {
    const f = await prisma.funcionario.findUnique({ where: { id }, include: { empresa: { select: { id: true, nome: true } } } })
    if (!f) throw new NotFoundError('Funcionário não encontrado')
    if (empresaId && f.empresaId !== empresaId) throw new NotFoundError('Funcionário não encontrado')
    return f
  },

  async criar(data: { empresaId: string; nome: string; email: string; cargo: string; telefone?: string }) {
    await LicencaService.verificarLimiteFuncionarios(data.empresaId)
    if (await prisma.funcionario.findFirst({ where: { email: data.email, empresaId: data.empresaId } })) throw new ConflictError('Email já cadastrado nesta empresa')
    return prisma.funcionario.create({ data, include: { empresa: { select: { id: true, nome: true } } } })
  },

  async atualizar(id: string, data: Partial<{ nome: string; email: string; cargo: string; telefone: string; status: StatusFuncionario }>, empresaId?: string) {
    const f = await FuncionarioService.buscarPorId(id, empresaId)
    if (data.email && data.email !== f.email) {
      if (await prisma.funcionario.findFirst({ where: { email: data.email, empresaId: f.empresaId, NOT: { id } } })) throw new ConflictError('Email já em uso')
    }
    return prisma.funcionario.update({ where: { id }, data })
  },

  async desativar(id: string, empresaId?: string) {
    await FuncionarioService.buscarPorId(id, empresaId)
    return prisma.funcionario.update({ where: { id }, data: { status: StatusFuncionario.Inativo } })
  },
}