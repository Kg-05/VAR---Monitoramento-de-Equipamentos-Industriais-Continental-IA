// src/shared/types/express.d.ts
// Estende o tipo Request do Express para incluir req.user

import { Papel } from './enums'

import 'express'

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        papel: Papel
        empresaId: string | null
        // Só definido para Usuario papel Tecnico — id do Funcionario
        // vinculado, usado para restringir aos equipamentos destacados.
        funcionarioId?: string | null
      }
    }
  }
}

export {}
