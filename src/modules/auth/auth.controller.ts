import { Request, Response, NextFunction } from 'express'
import { AuthService } from './auth.service'
import { success }     from '@/shared/utils/httpResponse'

function contexto(req: Request) {
  return { userAgent: req.headers['user-agent'], ip: req.ip }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await AuthService.login(req.body, contexto(req))
    return success(res, result)
  } catch (err) { next(err) }
}

export async function loginTotp(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await AuthService.loginComTotp(req.body.usuarioId, req.body.codigo, contexto(req))
    return success(res, result)
  } catch (err) { next(err) }
}
