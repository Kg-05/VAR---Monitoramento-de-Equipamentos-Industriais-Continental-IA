import { z } from 'zod'

const criarAlertaSchema = z.object({
  equipamentoId: z.string().uuid(),
  descricao:     z.string().min(5),
  nivel:         z.enum(['razoavel', 'medio', 'critico']),
  empresaId:     z.string().uuid().optional(),
})

export { criarAlertaSchema }