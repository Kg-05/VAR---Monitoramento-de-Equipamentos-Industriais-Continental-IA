import { Request, Response, NextFunction } from 'express'
import { AlertaService } from './alerta.service'
import { success, created, noContent } from '@/shared/utils/httpResponse'

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