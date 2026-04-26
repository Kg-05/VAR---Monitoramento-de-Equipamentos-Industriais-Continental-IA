import { Request, Response, NextFunction } from 'express'
import { AuthService } from './auth.service'
import { success }     from '@/shared/utils/httpResponse'

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await AuthService.login(req.body)
    return success(res, result)
  } catch (err) { next(err) }
}

