import { z } from 'zod'
import { nifAngolanoSchema, telefoneAngolanoSchema } from '@/shared/utils/validadoresAngola'

export const criarEmpresaSchema = z.object({
  nome:     z.string().min(2),
  cnpj:     nifAngolanoSchema,
  email:    z.string().email(),
  telefone: telefoneAngolanoSchema.optional(),
})

export const atualizarEmpresaSchema = criarEmpresaSchema.partial().omit({ cnpj: true }).extend({
  status: z.enum(['Ativo', 'Inativo']).optional(),
})
