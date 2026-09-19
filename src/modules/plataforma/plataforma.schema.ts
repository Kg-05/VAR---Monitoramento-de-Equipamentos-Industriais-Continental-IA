import { z } from 'zod'

export const atualizarPlataformaSchema = z.object({
  nome:   z.string().min(2).optional(),
  idioma: z.string().min(2).optional(),
})
