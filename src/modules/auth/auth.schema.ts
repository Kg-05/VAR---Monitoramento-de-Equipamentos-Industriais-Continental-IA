import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  senha: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
})

export type LoginDto = z.infer<typeof loginSchema>

export const loginTotpSchema = z.object({
  usuarioId: z.string().uuid(),
  codigo:    z.string().min(6).max(6),
})
