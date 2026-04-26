import { NextFunction } from 'express'
import { ZodSchema } from 'zod'

export function validar(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      return _res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors:  result.error.flatten().fieldErrors,
      })
    }
    req.body = result.data
    next()
  }
}
