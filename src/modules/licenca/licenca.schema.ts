import { z } from 'zod'

export const criarLicencaSchema = z.object({
  empresaId:         z.string().uuid(),
  plano:             z.enum(['Basico', 'Profissional', 'Premium']),
  maxDeFuncionarios: z.number().int().positive(),
  inicioEm:          z.coerce.date(),
  expiraEm:          z.coerce.date(),
  observacoes:       z.string().optional(),
})
export const atualizarLicencaSchema = criarLicencaSchema.partial().extend({
  status: z.enum(['Ativa', 'Expirada', 'Suspensa']).optional(),
})