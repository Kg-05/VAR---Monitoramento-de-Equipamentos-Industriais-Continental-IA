import { Request, Response, NextFunction } from 'express'
import { success, created } from '@/shared/utils/httpResponse'
import { PagamentoService } from './pagamento.service'

export async function listarPagamentos(req: Request, res: Response, next: NextFunction) {
  try {
    return success(res, await PagamentoService.listar(req.query))
  } catch (e) { next(e) }
}

export async function buscarPagamento(req: Request, res: Response, next: NextFunction) {
  try {
    return success(res, await PagamentoService.buscarPorId(req.params.id))
  } catch (e) { next(e) }
}

export async function criarPagamento(req: Request, res: Response, next: NextFunction) {
  try {
    return created(res, await PagamentoService.criar(req.body))
  } catch (e) { next(e) }
}

export async function atualizarPagamento(req: Request, res: Response, next: NextFunction) {
  try {
    return success(res, await PagamentoService.atualizar(req.params.id, req.body))
  } catch (e) { next(e) }
}
