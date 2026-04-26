import { Request, Response, NextFunction } from 'express'
import { EmpresaService } from './empresa.service'
import { success, created, noContent } from '@/shared/utils/httpResponse'

export async function listarEmpresas(req: Request, res: Response, next: NextFunction) {
  try { return success(res, await EmpresaService.listar(req.query)) } catch (e) { next(e) }
}
export async function buscarEmpresa(req: Request, res: Response, next: NextFunction) {
  try { return success(res, await EmpresaService.buscarPorId(req.params.id)) } catch (e) { next(e) }
}
export async function criarEmpresa(req: Request, res: Response, next: NextFunction) {
  try { return created(res, await EmpresaService.criar(req.body)) } catch (e) { next(e) }
}
export async function atualizarEmpresa(req: Request, res: Response, next: NextFunction) {
  try { return success(res, await EmpresaService.atualizar(req.params.id, req.body)) } catch (e) { next(e) }
}
export async function desativarEmpresa(req: Request, res: Response, next: NextFunction) {
  try { await EmpresaService.desativar(req.params.id); return noContent(res) } catch (e) { next(e) }
}