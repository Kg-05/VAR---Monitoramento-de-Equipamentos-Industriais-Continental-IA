import { z } from 'zod'

export const criarUsuarioSchema = z.object({
  email:     z.string().email(),
  nome:      z.string().min(2),
  senha:     z.string().min(6),
  papel:     z.enum(['ADM', 'Operacional', 'Cliente']),
  empresaId: z.string().uuid().optional(),
})

export const atualizarUsuarioSchema = z.object({
  nome:   z.string().min(2).optional(),
  email:  z.string().email().optional(),
  status: z.enum(['Ativo', 'Inativo']).optional(),
})