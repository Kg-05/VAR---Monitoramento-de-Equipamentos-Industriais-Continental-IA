import { Request, Response, NextFunction } from 'express'
import { success, created } from '@/shared/utils/httpResponse'
import { LicencaService } from './licenca.service'

export async function listarLicencas(req: Request, res: Response, next: NextFunction) {
  try { return success(res, await LicencaService.listar(req.query)) } catch (e) { next(e) }
}
export async function buscarLicenca(req: Request, res: Response, next: NextFunction) {
  try { return success(res, await LicencaService.buscarPorId(req.params.id)) } catch (e) { next(e) }
}
export async function criarLicenca(req: Request, res: Response, next: NextFunction) {
  try { return created(res, await LicencaService.criar(req.body)) } catch (e) { next(e) }
}
export async function atualizarLicenca(req: Request, res: Response, next: NextFunction) {
  try { return success(res, await LicencaService.atualizar(req.params.id, req.body)) } catch (e) { next(e) }
}
