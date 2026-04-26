import { Request, Response, NextFunction } from 'express'
import { success } from '@/shared/utils/httpResponse'
import { LogService } from './log.service'

export async function listarLogs(req: Request, res: Response, next: NextFunction) {
  try {
    return success(res, await LogService.listar(req.query))
  } catch (e) { next(e) }
}
