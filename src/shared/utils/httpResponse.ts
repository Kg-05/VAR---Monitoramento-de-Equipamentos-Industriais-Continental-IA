// =============================================================
// Resposta HTTP padronizada
// =============================================================
import type { Response } from 'express'

export function success<T>(res: Response, data: T, statusCode = 200) {
  return res.status(statusCode).json({ success: true, data })
}

export function created<T>(res: Response, data: T) {
  return success(res, data, 201)
}

export function noContent(res: Response) {
  return res.status(204).send()
}
