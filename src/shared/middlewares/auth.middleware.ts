import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { UnauthorizedError } from '@/shared/errors/AppError'
 
export function autenticar(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Token não fornecido'))
  }
  const token = authHeader.split(' ')[1]
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as any
    ;(req as any).user = { id: payload.id, papel: payload.papel, empresaId: payload.empresaId }
    next()
  } catch {
    next(new UnauthorizedError('Token inválido ou expirado'))
  }
}