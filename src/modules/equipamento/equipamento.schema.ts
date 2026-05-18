// src/modules/equipamento/equipamento.schema.ts
import { z } from 'zod'

export const criarEquipamentoSchema = z.object({
  nome:        z.string().min(2),
  modelo:      z.string().min(1),
  fabricante:  z.string().optional(),
  numeroSerie: z.string().optional(),
  localizacao: z.string().min(2),
  empresaId:   z.string().uuid().optional(),
})

export const atualizarEquipamentoSchema = criarEquipamentoSchema.partial().extend({
  status: z.enum(['Operacional', 'Manutencao']).optional(),
})