import { Request, Response, NextFunction } from 'express'
import { success, created, noContent } from '@/shared/utils/httpResponse'
import { EquipamentoService } from './equipamento.service'

export async function listarEquipamentos(req: Request, res: Response, next: NextFunction) {
  try {
    return success(res, await EquipamentoService.listar(req.query))
  } catch (e) { next(e) }
}

export async function buscarEquipamento(req: Request, res: Response, next: NextFunction) {
  try {
    return success(res, await EquipamentoService.buscarPorId(
      req.params.id,
      req.user?.empresaId ?? undefined,
    ))
  } catch (e) { next(e) }
}

export async function criarEquipamento(req: Request, res: Response, next: NextFunction) {
  try {
    const empresaId = req.user?.papel === 'Cliente'
      ? req.user.empresaId!
      : req.body.empresaId
    return created(res, await EquipamentoService.criar({ ...req.body, empresaId }))
  } catch (e) { next(e) }
}

export async function atualizarEquipamento(req: Request, res: Response, next: NextFunction) {
  try {
    return success(res, await EquipamentoService.atualizar(
      req.params.id,
      req.body,
      req.user?.empresaId ?? undefined,
    ))
  } catch (e) { next(e) }
}

export async function removerEquipamento(req: Request, res: Response, next: NextFunction) {
  try {
    await EquipamentoService.remover(req.params.id)
    return noContent(res)
  } catch (e) { next(e) }
}