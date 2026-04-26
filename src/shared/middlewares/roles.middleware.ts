import { ForbiddenError } from '@/shared/errors/AppError'
import { NextFunction } from 'express'
import { Papel } from '../types/enums'

export function autorizar(...papeis: Papel[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !papeis.includes(req.user.papel)) {
      return next(new ForbiddenError('Acesso negado para este papel'))
    }
    next()
  }
}