import { Prisma } from '@prisma/client'
import { prisma }           from '@/shared/database/prisma.client'
import { NotFoundError, ConflictError } from '@/shared/errors/AppError'
import { parsePagination, paginar }     from '@/shared/utils/page'

export interface CreateEmpresaDto { nome: string; cnpj: string; email: string; telefone?: string }
export interface UpdateEmpresaDto { nome?: string; email?: string; telefone?: string; status?: 'Ativo' | 'Inativo' }
export interface ListarEmpresasQuery {
  [key: string]: unknown; // Permite chaves dinâmicas
  page?: unknown;
  limit?: unknown;
  search?: string;
  status?: string;
}


export const EmpresaService = {
  async listar(query: ListarEmpresasQuery) {
    const pagination = parsePagination(query)
    const where: Prisma.EmpresaWhereInput = {
      ...(query.status && { status: query.status as any }),
      ...(query.search && { OR: [
        { nome:  { contains: query.search, mode: 'insensitive' } },
        { cnpj:  { contains: query.search } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ]}),
    }
    const [empresas, total] = await prisma.$transaction([
      prisma.empresa.findMany({
        where, skip: pagination.skip, take: pagination.take,
        orderBy: { criadoEm: 'desc' },
        include: {
          _count:  { select: { funcionarios: true, equipamentos: true } },
          licencas: { orderBy: { expiraEm: 'desc' }, take: 1, select: { plano: true, status: true, expiraEm: true } },
        },
      }),
      prisma.empresa.count({ where }),
    ])
    return paginar(empresas, total, pagination)
  },

  async buscarPorId(id: string) {
    const empresa = await prisma.empresa.findUnique({
      where:   { id },
      include: { licencas: { orderBy: { criadoEm: 'desc' }, take: 1 }, _count: { select: { funcionarios: true, equipamentos: true, alertas: true } } },
    })
    if (!empresa) throw new NotFoundError('Empresa não encontrada')
    return empresa
  },

  async criar(data: CreateEmpresaDto) {
    if (await prisma.empresa.findUnique({ where: { cnpj: data.cnpj } }))   throw new ConflictError('CNPJ já cadastrado')
    if (await prisma.empresa.findUnique({ where: { email: data.email } })) throw new ConflictError('Email já cadastrado')
    return prisma.empresa.create({ data })
  },

  async atualizar(id: string, data: UpdateEmpresaDto) {
    await EmpresaService.buscarPorId(id)
    if (data.email) {
      const existe = await prisma.empresa.findFirst({ where: { email: data.email, NOT: { id } } })
      if (existe) throw new ConflictError('Email já em uso')
    }
    return prisma.empresa.update({ where: { id }, data })
  },

  async desativar(id: string) {
    await EmpresaService.buscarPorId(id)
    return prisma.empresa.update({ where: { id }, data: { status: 'Inativo' } })
  },
}