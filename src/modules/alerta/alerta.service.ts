// src/modules/alerta/alerta.service.ts
import { NivelAlerta } from '@prisma/client'
import { prisma }                   from '@/shared/database/prisma.client'
import { NotFoundError, ConflictError } from '@/shared/errors/AppError'
import { parsePagination, paginar }     from '@/shared/utils/page'

export const AlertaService = {

  async listar(query: Record<string, any>) {
    const pagination = parsePagination(query)
    const where: any = {}
    if (query.empresaId)     where.empresaId     = query.empresaId
    if (query.equipamentoId) where.equipamentoId = query.equipamentoId
    if (query.nivel)         where.nivel         = query.nivel
    if (query.lido === 'true')  where.lidoEm = { not: null }
    if (query.lido === 'false') where.lidoEm = null
    if (query.dataInicio || query.dataFim) {
      where.criadoEm = {}
      if (query.dataInicio) where.criadoEm.gte = new Date(query.dataInicio)
      if (query.dataFim)    where.criadoEm.lte = new Date(query.dataFim)
    }

    const [alertas, total] = await prisma.$transaction([
      prisma.alerta.findMany({
        where,
        skip:    pagination.skip,
        take:    pagination.take,
        orderBy: [{ nivel: 'desc' }, { criadoEm: 'desc' }],
        include: {
          equipamento: { select: { id: true, nome: true, localizacao: true } },
          lidoPor:     { select: { id: true, nome: true } },
        },
      }),
      prisma.alerta.count({ where }),
    ])
    return paginar(alertas, total, pagination)
  },

  async buscarPorId(id: string, empresaId?: string) {
    const a = await prisma.alerta.findUnique({
      where:   { id },
      include: {
        equipamento: { select: { id: true, nome: true, localizacao: true, status: true } },
        empresa:     { select: { id: true, nome: true } },
        lidoPor:     { select: { id: true, nome: true, papel: true } },
      },
    })
    if (!a) throw new NotFoundError('Alerta não encontrado')
    if (empresaId && a.empresaId !== empresaId) throw new NotFoundError('Alerta não encontrado')
    return a
  },

  async criar(data: { empresaId: string; equipamentoId: string; descricao: string; nivel: NivelAlerta }) {
    const eq = await prisma.equipamento.findUnique({ where: { id: data.equipamentoId } })
    if (!eq) throw new NotFoundError('Equipamento não encontrado')
    if (eq.empresaId !== data.empresaId) throw new ConflictError('Equipamento não pertence a esta empresa')
    return prisma.alerta.create({
      data,
      include: { equipamento: { select: { id: true, nome: true, localizacao: true } } },
    })
  },

  async marcarComoLido(id: string, usuarioId: string, empresaId?: string) {
    const a = await AlertaService.buscarPorId(id, empresaId)
    if (a.lidoEm) throw new ConflictError('Alerta já foi marcado como lido')
    return prisma.alerta.update({
      where: { id },
      data:  { lidoPorId: usuarioId, lidoEm: new Date() },
      include: {
        equipamento: { select: { id: true, nome: true } },
        lidoPor:     { select: { id: true, nome: true } },
      },
    })
  },

  async remover(id: string) {
    await AlertaService.buscarPorId(id)
    return prisma.alerta.delete({ where: { id } })
  },

  async resumo(empresaId?: string) {
    const where: any = {}
    if (empresaId) where.empresaId = empresaId

    const [total, naoLidos, porNivel] = await prisma.$transaction([
      prisma.alerta.count({ where }),
      prisma.alerta.count({ where: { ...where, lidoEm: null } }),
      // "as any" evita o erro de tipo circular do Prisma 5 com groupBy
      (prisma.alerta.groupBy as any)({
        by:     ['nivel'],
        where,
        _count: true,
      }),
    ])

    const contagem: any = { razoavel: 0, medio: 0, critico: 0 }
    ;(porNivel as any[]).forEach((p: any) => { contagem[p.nivel] = p._count })

    return { total, naoLidos, porNivel: contagem }
  },

  async naoLidosRecentes(empresaId: string, limite = 10) {
    return prisma.alerta.findMany({
      where:   { empresaId, lidoEm: null },
      orderBy: [{ nivel: 'desc' }, { criadoEm: 'desc' }],
      take:    limite,
      include: { equipamento: { select: { id: true, nome: true, localizacao: true } } },
    })
  },
}