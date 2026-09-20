// src/shared/middlewares/validate.middleware.ts
import { Request, Response, NextFunction } from 'express'
import { ZodSchema } from 'zod'
 
export function validar(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      const fieldErrors  = result.error.flatten().fieldErrors
      // A primeira mensagem específica (ex: "NIF inválido — ...") é mais
      // útil no frontend do que um "Dados inválidos" genérico — a maioria
      // das páginas já mostra `message` diretamente ao usuário.
      const primeiraMsg = Object.values(fieldErrors).flat().find(Boolean)
      return res.status(400).json({
        success: false,
        message: primeiraMsg ?? 'Dados inválidos',
        errors:  fieldErrors,
      })
    }
    Object.assign(req, { body: result.data })
    next()
  }
}