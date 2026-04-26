import { z } from 'zod'

export const criarEmpresaSchema = z.object({
  nome:     z.string().min(2),
  cnpj:     z.string().min(14).max(18),
  email:    z.string().email(),
  telefone: z.string().optional(),
})

export const atualizarEmpresaSchema = criarEmpresaSchema.partial().omit({ cnpj: true }).extend({
  status: z.enum(['Ativo', 'Inativo']).optional(),
})