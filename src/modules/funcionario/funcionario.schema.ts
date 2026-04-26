import { z } from 'zod'

export const criarFuncionarioSchema = z.object({
  nome:      z.string().min(2),
  email:     z.string().email(),
  cargo:     z.string().min(2),
  telefone:  z.string().optional(),
  empresaId: z.string().uuid().optional(), // preenchido pelo middleware de escopo se Cliente
})

export const atualizarFuncionarioSchema = criarFuncionarioSchema.partial().extend({
  status: z.enum(['Ativo', 'Inativo', 'Pendente']).optional(),
})