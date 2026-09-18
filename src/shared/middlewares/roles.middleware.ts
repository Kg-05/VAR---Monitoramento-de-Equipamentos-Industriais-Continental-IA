import { Request, Response, NextFunction } from 'express'
import { ForbiddenError } from '@/shared/errors/AppError'
import { Papel } from '@/shared/types/enums'

export function autorizar(...papeis: Papel[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const user = req.user

    if (!user || !papeis.includes(user.papel)) {
      return next(new ForbiddenError('Acesso negado para este papel'))
    }

    next()
  }
}
