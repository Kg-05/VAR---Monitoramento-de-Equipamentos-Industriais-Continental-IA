import { Request, Response, NextFunction } from 'express'
import { success, paginado, created } from '@/shared/utils/httpResponse'
import { Papel } from '@/shared/types/enums'
import { LicencaService } from './licenca.service'

export async function listarLicencas(req: Request, res: Response, next: NextFunction) {
  try { return paginado(res, await LicencaService.listar(req.query)) } catch (e) { next(e) }
}
export async function buscarLicenca(req: Request, res: Response, next: NextFunction) {
  try { return success(res, await LicencaService.buscarPorId(req.params.id, req.user?.empresaId ?? undefined)) } catch (e) { next(e) }
}
export async function criarLicenca(req: Request, res: Response, next: NextFunction) {
  try {
    const empresaId = req.user?.papel === Papel.Cliente ? req.user.empresaId! : req.body.empresaId
    return created(res, await LicencaService.criar({ ...req.body, empresaId }))
  } catch (e) { next(e) }
}
export async function atualizarLicenca(req: Request, res: Response, next: NextFunction) {
  try { return success(res, await LicencaService.atualizar(req.params.id, req.body)) } catch (e) { next(e) }
}
