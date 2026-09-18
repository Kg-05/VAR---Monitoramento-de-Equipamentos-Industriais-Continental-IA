import { Router } from 'express'
import { autenticar } from '@/shared/middlewares/auth.middleware'
import { autorizar } from '@/shared/middlewares/roles.middleware'
import { validar } from '@/shared/middlewares/validate.middleware'
import { escopoEmpresa } from '@/shared/middlewares/tenant.middleware'
import { Papel } from '@/shared/types/enums'
import { criarFuncionarioSchema, atualizarFuncionarioSchema } from './funcionario.schema'
import { listarFuncionarios, buscarFuncionario, criarFuncionario, atualizarFuncionario, desativarFuncionario } from './funcionario.controller'

export const funcionarioRoutes = Router()

funcionarioRoutes.use('/funcionarios', autenticar)
funcionarioRoutes.use('/funcionarios', escopoEmpresa)

funcionarioRoutes.get(   '/funcionarios',     listarFuncionarios)
funcionarioRoutes.post(  '/funcionarios',     validar(criarFuncionarioSchema),     criarFuncionario)
funcionarioRoutes.get(   '/funcionarios/:id', buscarFuncionario)
funcionarioRoutes.patch( '/funcionarios/:id', validar(atualizarFuncionarioSchema), atualizarFuncionario)
funcionarioRoutes.delete('/funcionarios/:id', autorizar(Papel.ADM, Papel.Operacional), desativarFuncionario)