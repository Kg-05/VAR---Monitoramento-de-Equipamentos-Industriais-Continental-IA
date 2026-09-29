import { Request, Response, NextFunction } from 'express'
import { success, paginado, created, noContent } from '@/shared/utils/httpResponse'
import { EquipamentoService } from './equipamento.service'

export async function listarEquipamentos(req: Request, res: Response, next: NextFunction) {
  try {
    return paginado(res, await EquipamentoService.listar(req.query, req.user?.funcionarioId ?? undefined))
  } catch (e) { next(e) }
}

export async function resumoEquipamentos(req: Request, res: Response, next: NextFunction) {
  try {
    return success(res, await EquipamentoService.resumo(req.user?.empresaId ?? undefined, req.user?.funcionarioId ?? undefined))
  } catch (e) { next(e) }
}

export async function buscarEquipamento(req: Request, res: Response, next: NextFunction) {
  try {
    return success(res, await EquipamentoService.buscarPorId(
      req.params.id,
      req.user?.empresaId ?? undefined,
      req.user?.funcionarioId ?? undefined,
    ))
  } catch (e) { next(e) }
}

export async function destacarFuncionario(req: Request, res: Response, next: NextFunction) {
  try {
    return created(res, await EquipamentoService.destacarFuncionario(
      req.params.id,
      req.body.funcionarioId,
      req.user!.id,
      req.user?.empresaId ?? undefined,
    ))
  } catch (e) { next(e) }
}

export async function removerDestaqueFuncionario(req: Request, res: Response, next: NextFunction) {
  try {
    await EquipamentoService.removerDestaque(req.params.id, req.params.funcionarioId, req.user?.empresaId ?? undefined)
    return noContent(res)
  } catch (e) { next(e) }
}

export async function listarDestacados(req: Request, res: Response, next: NextFunction) {
  try {
    return success(res, await EquipamentoService.listarDestacados(req.params.id, req.user?.empresaId ?? undefined))
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