// src/shared/types/express.d.ts
// Estende o tipo Request do Express para incluir req.user

import 'express'

declare global {
  namespace Express {
    interface Request {
      user?: {
        id:        string
        papel:     string
        empresaId: string | null
      }
    }
  }
}

export {}