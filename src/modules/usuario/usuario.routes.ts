import { Router } from 'express'
import { autenticar } from '@/shared/middlewares/auth.middleware'
import { autorizar } from '@/shared/middlewares/roles.middleware'
import { validar } from '@/shared/middlewares/validate.middleware'
import { criarUsuarioSchema, atualizarUsuarioSchema } from './usuario.schema'
import { listarUsuarios, buscarUsuario, criarUsuario, atualizarUsuario, desativarUsuario } from './usuario.controller'
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
