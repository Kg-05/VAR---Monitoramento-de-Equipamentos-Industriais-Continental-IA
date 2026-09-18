import { Request, Response, NextFunction } from 'express'
import { success, paginado, created } from '@/shared/utils/httpResponse'
import { Papel } from '@/shared/types/enums'
import { PagamentoService } from './pagamento.service'

export async function listarPagamentos(req: Request, res: Response, next: NextFunction) {
  try {
    return paginado(res, await PagamentoService.listar(req.query))
  } catch (e) { next(e) }
}

export async function buscarPagamento(req: Request, res: Response, next: NextFunction) {
  try {
    return success(res, await PagamentoService.buscarPorId(req.params.id, req.user?.empresaId ?? undefined))
  } catch (e) { next(e) }
}

export async function criarPagamento(req: Request, res: Response, next: NextFunction) {
  try {
    const empresaId = req.user?.papel === Papel.Cliente ? req.user.empresaId! : req.body.empresaId
    return created(res, await PagamentoService.criar({ ...req.body, empresaId }))
  } catch (e) { next(e) }
}

export async function atualizarPagamento(req: Request, res: Response, next: NextFunction) {
  try {
    return success(res, await PagamentoService.atualizar(req.params.id, req.body))
  } catch (e) { next(e) }
}
