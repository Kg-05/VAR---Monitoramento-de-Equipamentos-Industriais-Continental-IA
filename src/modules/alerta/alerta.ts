// =============================================================
// src/modules/alerta/alerta.schema.ts
// =============================================================
import { z } from 'zod'

const criarAlertaSchema = z.object({
  equipamentoId: z.string().uuid(),
  descricao:     z.string().min(5),
  nivel:         z.enum(['razoavel', 'medio', 'critico']),
  empresaId:     z.string().uuid().optional(),
})

export { criarAlertaSchema }

// =============================================================
// src/modules/alerta/alerta.service.ts
// =============================================================
import { NivelAlerta, Prisma } from '@prisma/client'
import { prisma }           from '@/shared/database/prisma.client'
import { NotFoundError, ConflictError } from '@/shared/errors/AppError'
import { parsePagination, paginar }     from '@/shared/utils/index'


export const AlertaService = {
  async listar(query: Record<string, unknown>) {
    const pagination = parsePagination(query)
    const where: Prisma.AlertaWhereInput = {
      ...(query.empresaId     && { empresaId:     query.empresaId as string }),
      ...(query.equipamentoId && { equipamentoId: query.equipamentoId as string }),
      ...(query.nivel         && { nivel:         query.nivel as NivelAlerta }),
      ...(query.lido === 'true'  && { lidoEm: { not: null } }),
      ...(query.lido === 'false' && { lidoEm: null }),
      ...((query.dataInicio || query.dataFim) && { criadoEm: {
        ...(query.dataInicio && { gte: new Date(query.dataInicio as string) }),
        ...(query.dataFim    && { lte: new Date(query.dataFim    as string) }),
      }}),
    }
    const [alertas, total] = await prisma.$transaction([
      prisma.alerta.findMany({ where, skip: pagination.skip, take: pagination.take, orderBy: [{ nivel: 'desc' }, { criadoEm: 'desc' }], include: { equipamento: { select: { id: true, nome: true, localizacao: true } }, lidoPor: { select: { id: true, nome: true } } } }),
      prisma.alerta.count({ where }),
    ])
    return paginar(alertas, total, pagination)
  },

  async buscarPorId(id: string, empresaId?: string) {
    const a = await prisma.alerta.findUnique({ where: { id }, include: { equipamento: { select: { id: true, nome: true, localizacao: true, status: true } }, empresa: { select: { id: true, nome: true } }, lidoPor: { select: { id: true, nome: true, papel: true } } } })
    if (!a) throw new NotFoundError('Alerta não encontrado')
    if (empresaId && a.empresaId !== empresaId) throw new NotFoundError('Alerta não encontrado')
    return a
  },

  async criar(data: { empresaId: string; equipamentoId: string; descricao: string; nivel: NivelAlerta }) {
    const eq = await prisma.equipamento.findUnique({ where: { id: data.equipamentoId } })
    if (!eq) throw new NotFoundError('Equipamento não encontrado')
    if (eq.empresaId !== data.empresaId) throw new ConflictError('Equipamento não pertence a esta empresa')
    return prisma.alerta.create({ data, include: { equipamento: { select: { id: true, nome: true, localizacao: true } } } })
  },

  async marcarComoLido(id: string, usuarioId: string, empresaId?: string) {
    const a = await AlertaService.buscarPorId(id, empresaId)
    if (a.lidoEm) throw new ConflictError('Alerta já foi marcado como lido')
    return prisma.alerta.update({ where: { id }, data: { lidoPorId: usuarioId, lidoEm: new Date() }, include: { equipamento: { select: { id: true, nome: true } }, lidoPor: { select: { id: true, nome: true } } } })
  },

  async remover(id: string) {
    await AlertaService.buscarPorId(id)
    return prisma.alerta.delete({ where: { id } })
  },

  async resumo(empresaId?: string) {
    const where: Prisma.AlertaWhereInput = { ...(empresaId && { empresaId }) }
    const [total, naoLidos, porNivel] = await prisma.$transaction([
      prisma.alerta.count({ where }),
      prisma.alerta.count({ where: { ...where, lidoEm: null } }),
      prisma.alerta.groupBy({ by: ['nivel'], where, _count: { nivel: true } }),
    ])
    const contagem = { razoavel: 0, medio: 0, critico: 0 }
    porNivel.forEach(({ nivel, _count }) => { (contagem as any)[nivel] = _count.nivel })
    return { total, naoLidos, porNivel: contagem }
  },

  async naoLidosRecentes(empresaId: string, limite = 10) {
    return prisma.alerta.findMany({ where: { empresaId, lidoEm: null }, orderBy: [{ nivel: 'desc' }, { criadoEm: 'desc' }], take: limite, include: { equipamento: { select: { id: true, nome: true, localizacao: true } } } })
  },
}

// =============================================================
// src/modules/alerta/alerta.controller.ts
// =============================================================
import { Request, Response, NextFunction } from 'express'
import { AlertaService } from './alerta.service'
import { success, created, noContent } from '@/shared/utils/index'

export async function listarAlertas(req: Request, res: Response, next: NextFunction) {
  try { return success(res, await AlertaService.listar(req.query)) } catch (e) { next(e) }
}
export async function buscarAlerta(req: Request, res: Response, next: NextFunction) {
  try { return success(res, await AlertaService.buscarPorId(req.params.id, req.user?.empresaId ?? undefined)) } catch (e) { next(e) }
}
export async function criarAlerta(req: Request, res: Response, next: NextFunction) {
  try {
    const empresaId = req.user?.papel === 'Cliente' ? req.user.empresaId! : req.body.empresaId
    return created(res, await AlertaService.criar({ ...req.body, empresaId }))
  } catch (e) { next(e) }
}
export async function marcarAlertaLido(req: Request, res: Response, next: NextFunction) {
  try { return success(res, await AlertaService.marcarComoLido(req.params.id, req.user!.id, req.user?.empresaId ?? undefined)) } catch (e) { next(e) }
}
export async function removerAlerta(req: Request, res: Response, next: NextFunction) {
  try { await AlertaService.remover(req.params.id); return noContent(res) } catch (e) { next(e) }
}
export async function resumoAlertas(req: Request, res: Response, next: NextFunction) {
  try { return success(res, await AlertaService.resumo(req.user?.empresaId ?? undefined)) } catch (e) { next(e) }
}
export async function alertasNaoLidos(req: Request, res: Response, next: NextFunction) {
  try { return success(res, await AlertaService.naoLidosRecentes(req.user!.empresaId!)) } catch (e) { next(e) }
}

// =============================================================
// src/modules/alerta/alerta.routes.ts
// =============================================================
import { Router } from 'express'
import { autenticar, autorizar, validar, escopoEmpresa } from '@/shared/middlewares/index'
import { Papel } from '@/shared/types/enums'
import { criarAlertaSchema } from './alerta.schema'
import { listarAlertas, buscarAlerta, criarAlerta, marcarAlertaLido, removerAlerta, resumoAlertas, alertasNaoLidos } from './alerta.controller'

export const alertaRoutes = Router()
alertaRoutes.use(autenticar, escopoEmpresa)
alertaRoutes.get(   '/alertas/resumo',       resumoAlertas)
alertaRoutes.get(   '/alertas/nao-lidos',    alertasNaoLidos)
alertaRoutes.get(   '/alertas',              listarAlertas)
alertaRoutes.post(  '/alertas',              validar(criarAlertaSchema), criarAlerta)
alertaRoutes.get(   '/alertas/:id',          buscarAlerta)
alertaRoutes.patch( '/alertas/:id/ler',      marcarAlertaLido)
alertaRoutes.delete('/alertas/:id',          autorizar(Papel.ADM), removerAlerta)
