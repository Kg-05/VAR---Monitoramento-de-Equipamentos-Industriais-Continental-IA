import { ForbiddenError } from '@/shared/errors/AppError'
import { NextFunction } from 'express'
 
export function autorizar(...papeis: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const user = (req as any).user
    if (!user || !papeis.includes(user.papel)) {
      return next(new ForbiddenError('Acesso negado para este papel'))
    }
    next()
  }
}
