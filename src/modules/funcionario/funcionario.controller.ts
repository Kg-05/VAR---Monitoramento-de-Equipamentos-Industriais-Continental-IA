import { Request, Response, NextFunction } from 'express'
import { FuncionarioService } from './funcionario.service'
import { success, created, noContent } from '@/shared/utils/httpResponse'

export async function listarFuncionarios(req: Request, res: Response, next: NextFunction) {
  try { return success(res, await FuncionarioService.listar(req.query)) } catch (e) { next(e) }
}
export async function buscarFuncionario(req: Request, res: Response, next: NextFunction) {
  try { return success(res, await FuncionarioService.buscarPorId(req.params.id, req.user?.empresaId ?? undefined)) 

  } catch (e) { next(e) }
}
export async function criarFuncionario(req: Request, res: Response, next: NextFunction) {
  try {
    const empresaId = req.user?.papel === 'Cliente' ? req.user.empresaId! : req.body.empresaId
    return created(res, await FuncionarioService.criar({ ...req.body, empresaId }))
  } catch (e) { next(e) }
}
export async function atualizarFuncionario(req: Request, res: Response, next: NextFunction) {
  try { return success(res, await FuncionarioService.atualizar(req.params.id, req.body, req.user?.empresaId ?? undefined)) } catch (e) { next(e) }
}
export async function desativarFuncionario(req: Request, res: Response, next: NextFunction) {
  try { await FuncionarioService.desativar(req.params.id, req.user?.empresaId ?? undefined); return noContent(res) } catch (e) { next(e) }
}