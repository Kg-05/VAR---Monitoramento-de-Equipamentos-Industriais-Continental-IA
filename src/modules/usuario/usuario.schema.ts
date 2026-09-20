import { z } from 'zod'

export const criarUsuarioSchema = z.object({
  email:     z.string().email(),
  nome:      z.string().min(2),
  senha:     z.string().min(6),
  papel:     z.enum(['ADM', 'Operacional', 'Cliente']),
  empresaId: z.string().uuid().optional(),
})

export const atualizarUsuarioSchema = z.object({
  nome:   z.string().min(2).optional(),
  email:  z.string().email().optional(),
  status: z.enum(['Ativo', 'Inativo']).optional(),
})

export const alterarSenhaSchema = z.object({
  senhaAtual: z.string().min(6),
  novaSenha:  z.string().min(6),
})

// Usado por ADM/Operacional para repor a senha de outro usuário (ex: pedido
// de recuperação de senha atendido manualmente) — não exige a senha atual.
export const redefinirSenhaSchema = z.object({
  novaSenha: z.string().min(6),
})

export const notificacaoEmailSchema = z.object({
  ativa: z.boolean(),
})

export const permissoesSchema = z.object({
  permissaoAlertas: z.boolean().optional(),
  permissaoGestao:  z.boolean().optional(),
})

export const ativarTotpSchema = z.object({
  segredo: z.string().min(1),
  codigo:  z.string().min(6).max(6),
})

export const verificarTotpLoginSchema = z.object({
  usuarioId: z.string().uuid(),
  codigo:    z.string().min(6).max(6),
})