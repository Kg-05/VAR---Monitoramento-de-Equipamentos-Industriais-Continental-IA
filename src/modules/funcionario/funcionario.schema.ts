import { z } from 'zod'
import { telefoneAngolanoSchema } from '@/shared/utils/validadoresAngola'

export const criarFuncionarioSchema = z.object({
  nome:      z.string().min(2),
  email:     z.string().email(),
  cargo:     z.string().min(2),
  telefone:  telefoneAngolanoSchema.optional(),
  empresaId: z.string().uuid().optional(), // preenchido pelo middleware de escopo se Cliente
})

export const atualizarFuncionarioSchema = criarFuncionarioSchema.partial().extend({
  status: z.enum(['Ativo', 'Inativo', 'Pendente']).optional(),
})
