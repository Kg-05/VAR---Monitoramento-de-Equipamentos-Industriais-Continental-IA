import { Router } from 'express'
import { autenticar } from '@/shared/middlewares/auth.middleware'
import { autorizar } from '@/shared/middlewares/roles.middleware'
import { validar } from '@/shared/middlewares/validate.middleware'
import { criarUsuarioSchema, atualizarUsuarioSchema } from './usuario.schema'
import { listarUsuarios, buscarUsuario, criarUsuario, atualizarUsuario, desativarUsuario } from './usuario.controller'
import { Papel } from '@/shared/types/enums'

export const usuarioRoutes = Router()

usuarioRoutes.use('/usuarios', autenticar)
usuarioRoutes.use('/usuarios', autorizar(Papel.ADM, Papel.Operacional))

usuarioRoutes.get(   '/usuarios',     listarUsuarios)
usuarioRoutes.post(  '/usuarios',     validar(criarUsuarioSchema),     criarUsuario)
usuarioRoutes.get(   '/usuarios/:id', buscarUsuario)
usuarioRoutes.patch( '/usuarios/:id', validar(atualizarUsuarioSchema), atualizarUsuario)
usuarioRoutes.delete('/usuarios/:id', desativarUsuario)
