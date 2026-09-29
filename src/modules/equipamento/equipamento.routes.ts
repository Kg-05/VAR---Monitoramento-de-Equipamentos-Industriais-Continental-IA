// src/modules/equipamento/equipamento.routes.ts
import { Router }    from 'express'
import { autenticar } from '@/shared/middlewares/auth.middleware'
import { autorizar } from '@/shared/middlewares/roles.middleware'
import { validar } from '@/shared/middlewares/validate.middleware'
import { escopoEmpresa } from '@/shared/middlewares/tenant.middleware'
import { Papel }     from '@/shared/types/enums'
import { criarEquipamentoSchema, atualizarEquipamentoSchema, destacarFuncionarioSchema } from './equipamento.schema'
import {
  listarEquipamentos,
  buscarEquipamento,
  criarEquipamento,
  atualizarEquipamento,
  removerEquipamento,
  destacarFuncionario,
  removerDestaqueFuncionario,
  listarDestacados,
} from './equipamento.controller'

export const equipamentoRoutes = Router()

equipamentoRoutes.use('/equipamentos', autenticar)
equipamentoRoutes.use('/equipamentos', escopoEmpresa)

equipamentoRoutes.get(   '/equipamentos',     listarEquipamentos)
equipamentoRoutes.post(  '/equipamentos',     validar(criarEquipamentoSchema),     criarEquipamento)
equipamentoRoutes.get(   '/equipamentos/:id', buscarEquipamento)
equipamentoRoutes.patch( '/equipamentos/:id', validar(atualizarEquipamentoSchema), atualizarEquipamento)
equipamentoRoutes.delete('/equipamentos/:id', autorizar(Papel.ADM, Papel.Operacional), removerEquipamento)

// Destacar/remover um Funcionario (Técnico) de um equipamento — quem
// gere isto é a empresa (Cliente) ou a Kituxi (ADM/Operacional), nunca
// o próprio Técnico.
equipamentoRoutes.get(
  '/equipamentos/:id/destacados',
  autorizar(Papel.ADM, Papel.Operacional, Papel.Cliente),
  listarDestacados,
)
equipamentoRoutes.post(
  '/equipamentos/:id/destacar',
  autorizar(Papel.ADM, Papel.Operacional, Papel.Cliente),
  validar(destacarFuncionarioSchema),
  destacarFuncionario,
)
equipamentoRoutes.delete(
  '/equipamentos/:id/destacar/:funcionarioId',
  autorizar(Papel.ADM, Papel.Operacional, Papel.Cliente),
  removerDestaqueFuncionario,
)