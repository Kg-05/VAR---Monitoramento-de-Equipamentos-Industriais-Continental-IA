import { Router } from 'express'
import { autenticar } from '@/shared/middlewares/auth.middleware'
import { autorizar } from '@/shared/middlewares/roles.middleware'
import { validar } from '@/shared/middlewares/validate.middleware'
import { uploadImagem } from '@/shared/middlewares/upload.middleware'
import {
  criarUsuarioSchema,
  atualizarUsuarioSchema,
  alterarSenhaSchema,
  notificacaoEmailSchema,
  ativarTotpSchema,
} from './usuario.schema'
import {
  listarUsuarios,
  buscarUsuario,
  criarUsuario,
  atualizarUsuario,
  desativarUsuario,
  alterarSenha,
  atualizarAvatar,
  definirNotificacaoEmail,
  gerarSegredoTotp,
  ativarTotp,
  desativarTotp,
  listarSessoes,
  encerrarSessao,
} from './usuario.controller'
import { Papel } from '@/shared/types/enums'

export const usuarioRoutes = Router()

usuarioRoutes.use('/usuarios', autenticar)

usuarioRoutes.get(   '/usuarios',     autorizar(Papel.ADM, Papel.Operacional), listarUsuarios)
usuarioRoutes.post(  '/usuarios',     autorizar(Papel.ADM, Papel.Operacional), validar(criarUsuarioSchema), criarUsuario)
usuarioRoutes.get(   '/usuarios/:id', autorizar(Papel.ADM, Papel.Operacional), buscarUsuario)

// Qualquer utilizador pode actualizar o próprio perfil (nome/email);
// ADM/Operacional podem actualizar qualquer utilizador — a permissão
// é verificada dentro do controller.
usuarioRoutes.patch( '/usuarios/:id', validar(atualizarUsuarioSchema), atualizarUsuario)

usuarioRoutes.delete('/usuarios/:id', autorizar(Papel.ADM, Papel.Operacional), desativarUsuario)

// Acções de conta — sempre restritas ao próprio utilizador (verificado no controller)
usuarioRoutes.patch( '/usuarios/:id/senha',        validar(alterarSenhaSchema), alterarSenha)
usuarioRoutes.patch( '/usuarios/:id/avatar',        uploadImagem.single('avatar'), atualizarAvatar)
usuarioRoutes.patch( '/usuarios/:id/notificacao',   validar(notificacaoEmailSchema), definirNotificacaoEmail)
usuarioRoutes.post(  '/usuarios/:id/totp/gerar',    gerarSegredoTotp)
usuarioRoutes.post(  '/usuarios/:id/totp/ativar',   validar(ativarTotpSchema), ativarTotp)
usuarioRoutes.delete('/usuarios/:id/totp',          desativarTotp)
usuarioRoutes.get(   '/usuarios/:id/sessoes',       listarSessoes)
usuarioRoutes.delete('/usuarios/:id/sessoes/:sessaoId', encerrarSessao)
