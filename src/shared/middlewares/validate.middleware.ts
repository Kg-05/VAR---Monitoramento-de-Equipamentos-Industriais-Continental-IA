// src/shared/middlewares/validate.middleware.ts
import { Request, Response, NextFunction } from 'express'
import { ZodSchema } from 'zod'

export function validar(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors:  result.error.flatten().fieldErrors,
      })
    }
    // Usa Object.assign para evitar erro de readonly
    Object.assign(req, { body: result.data })
    next()
  }
}