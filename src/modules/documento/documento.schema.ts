// src/modules/documento/documento.schema.ts
import { z } from 'zod'

export const criarDocumentoSchema = z.object({
  empresaId: z.string().uuid().optional(),
})
