import { Router } from 'express'
// import { autenticar, autorizar, validar, escopoEmpresa } from '@/shared/middlewares/index'
import { Papel } from '@/shared/types/enums'
import { listarEquipamentos, criarEquipamentoSchema, criarEquipamento, buscarEquipamento, atualizarEquipamentoSchema, atualizarEquipamento, removerEquipamento } from './equipamento.controller'

export const equipamentoRoutes = Router()

// equipamentoRoutes.use(autenticar, escopoEmpresa)
equipamentoRoutes.get(   '/equipamentos',     listarEquipamentos)
equipamentoRoutes.post(  '/equipamentos',     criarEquipamento)
equipamentoRoutes.get(   '/equipamentos/:id', buscarEquipamento)
equipamentoRoutes.patch( '/equipamentos/:id', atualizarEquipamento)
equipamentoRoutes.delete('/equipamentos/:id', removerEquipamento)