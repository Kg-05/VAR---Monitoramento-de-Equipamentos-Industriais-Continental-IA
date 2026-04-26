import { Papel, Prisma }            from '@prisma/client'
import { prisma }                   from '@/shared/database/prisma.client'
import { parsePagination, paginar } from '@/shared/utils/page'

export const LogService = {

  async listar(query: Record<string, unknown>) {
    const pagination = parsePagination(query)

    const where: Prisma.LogWhereInput = {
      ...(query.usuarioId  && { usuarioId:    query.usuarioId  as string }),
      ...(query.empresaId  && { empresaId:    query.empresaId  as string }),
      ...(query.papel      && { nivelUsuario: query.papel      as Papel  }),
      ...(query.statusHttp && { statusHttp:   parseInt(String(query.statusHttp)) }),
      ...(query.acao       && {
        acao: { contains: query.acao as string, mode: 'insensitive' as const },
      }),
      ...((query.dataInicio || query.dataFim) && {
        criadoEm: {
          ...(query.dataInicio && { gte: new Date(query.dataInicio as string) }),
          ...(query.dataFim    && { lte: new Date(query.dataFim    as string) }),
        },
      }),
    }

    const [logs, total] = await prisma.$transaction([
      prisma.log.findMany({
        where,
        skip:    pagination.skip,
        take:    pagination.take,
        orderBy: { criadoEm: 'desc' },
        include: {
          usuario: { select: { id: true, nome: true, email: true, papel: true } },
          empresa: { select: { id: true, nome: true } },
        },
      }),
      prisma.log.count({ where }),
    ])

    return paginar(logs, total, pagination)
  },

  // Chamado internamente pelo logger.middleware.ts
  async registrar(data: {
    usuarioId?:   string
    empresaId?:   string | null
    nivelUsuario: Papel
    acao:         string
    ip?:          string
    userAgent?:   string
    statusHttp?:  number
  }) {
    return prisma.log.create({ data })
  },
}