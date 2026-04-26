import z from "zod"

export const criarPagamentoSchema = z.object({
  empresaId:   z.string().uuid(),
  licencaId:   z.string().uuid(),
  valor:       z.number().positive(),
  moeda:       z.string().default('AOA'),
  referencia:  z.string().optional(),
})
export const atualizarPagamentoSchema = z.object({
  status:     z.enum(['Pendente', 'Concluido', 'Reembolsado']),
  referencia: z.string().optional(),
})
