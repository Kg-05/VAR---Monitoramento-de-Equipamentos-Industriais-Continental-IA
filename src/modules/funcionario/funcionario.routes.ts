import { Router } from 'express'
import { autenticar } from '@/shared/middlewares/auth.middleware'
import { validar } from '@/shared/middlewares/validate.middleware'
import { escopoEmpresa } from '@/shared/middlewares/tenant.middleware'
import { criarFuncionarioSchema, atualizarFuncionarioSchema } from './funcionario.schema'
import { listarFuncionarios, buscarFuncionario, criarFuncionario, atualizarFuncionario, desativarFuncionario } from './funcionario.controller'

export const funcionarioRoutes = Router()

funcionarioRoutes.use('/funcionarios', autenticar)
funcionarioRoutes.use('/funcionarios', escopoEmpresa)

// Um Cliente gere os próprios funcionários (criar, actualizar, desativar);
// o escopo por empresa (tenant.middleware + FuncionarioService) impede-o
// de tocar em funcionários de outra empresa.
funcionarioRoutes.get(   '/funcionarios',     listarFuncionarios)
funcionarioRoutes.post(  '/funcionarios',     validar(criarFuncionarioSchema),     criarFuncionario)
funcionarioRoutes.get(   '/funcionarios/:id', buscarFuncionario)
funcionarioRoutes.patch( '/funcionarios/:id', validar(atualizarFuncionarioSchema), atualizarFuncionario)
funcionarioRoutes.delete('/funcionarios/:id', desativarFuncionario)