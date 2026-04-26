import { Router } from 'express'
// import { autenticar, autorizar, validar, escopoEmpresa } from '@/shared/middlewares/index'
import { Papel } from '@/shared/types/enums'
import { criarFuncionarioSchema, atualizarFuncionarioSchema } from './funcionario.schema'
import { listarFuncionarios, buscarFuncionario, criarFuncionario, atualizarFuncionario, desativarFuncionario } from './funcionario.controller'

export const funcionarioRoutes = Router()
// funcionarioRoutes.use(autenticar, escopoEmpresa)
funcionarioRoutes.get(   '/funcionarios',     listarFuncionarios)
funcionarioRoutes.post(  '/funcionarios',     criarFuncionario)
funcionarioRoutes.get(   '/funcionarios/:id', buscarFuncionario)
funcionarioRoutes.patch( '/funcionarios/:id', atualizarFuncionario)
funcionarioRoutes.delete('/funcionarios/:id', desativarFuncionario)