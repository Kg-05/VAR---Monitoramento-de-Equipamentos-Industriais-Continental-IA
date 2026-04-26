import { Router } from 'express'
// import { autenticar, autorizar, validar } from '@/shared/middlewares/index'
import { criarUsuarioSchema, atualizarUsuarioSchema } from './usuario.schema'
import { listarUsuarios, buscarUsuario, criarUsuario, atualizarUsuario, desativarUsuario } from './usuario.controller'
import { Papel } from '@/shared/types/enums'

export const usuarioRoutes = Router()
usuarioRoutes.get('/usuarios', listarUsuarios)
usuarioRoutes.post('/usuarios', criarUsuario)
usuarioRoutes.get('/usuarios/:id',buscarUsuario)
usuarioRoutes.patch('/usuarios/:id',atualizarUsuario)
usuarioRoutes.delete('/usuarios/:id', desativarUsuario)
