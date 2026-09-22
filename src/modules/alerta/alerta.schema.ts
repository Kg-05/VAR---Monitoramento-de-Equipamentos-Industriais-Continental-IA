import { z } from 'zod'

const criarAlertaSchema = z.object({
  equipamentoId: z.string().uuid(),
  descricao:     z.string().min(5),
  nivel:         z.enum(['razoavel', 'medio', 'critico']),
  empresaId:     z.string().uuid().optional(),
})

// Usado pelo Técnico (e ADM/Operacional) para redefinir o nível, atualizar
// o estado do tratamento e deixar uma nota sobre o alerta — todos os
// campos são opcionais, mas pelo menos um precisa de vir preenchido.
const atualizarAlertaSchema = z.object({
  nivel:       z.enum(['razoavel', 'medio', 'critico']).optional(),
  status:      z.enum(['Aberto', 'EmCurso', 'AguardaApoio', 'Resolvido']).optional(),
  notaTecnico: z.string().min(1).optional(),
}).refine(
  (data) => data.nivel !== undefined || data.status !== undefined || data.notaTecnico !== undefined,
  { message: 'Informe ao menos um campo para atualizar (nivel, status ou notaTecnico)' },
)

export { criarAlertaSchema, atualizarAlertaSchema }