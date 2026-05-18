// src/modules/equipamento/equipamento.routes.ts
import { Router } from 'express'
import { autenticar } from '@/shared/middlewares/auth.middleware'
import { autorizar } from '@/shared/middlewares/roles.middleware'
import { validar } from '@/shared/middlewares/validate.middleware'
import { escopoEmpresa } from '@/shared/middlewares/tenant.middleware'
import { Papel } from '@/shared/types/enums'
import { criarEquipamentoSchema, atualizarEquipamentoSchema } from './equipamento.schema'
import {
  listarEquipamentos,
  buscarEquipamento,
  criarEquipamento,
  atualizarEquipamento,
  removerEquipamento,
} from './equipamento.controller'

export const equipamentoRoutes = Router()

equipamentoRoutes.use(autenticar, escopoEmpresa)
equipamentoRoutes.get(   '/equipamentos',     listarEquipamentos)
equipamentoRoutes.post(  '/equipamentos',     validar(criarEquipamentoSchema),     criarEquipamento)
equipamentoRoutes.get(   '/equipamentos/:id', buscarEquipamento)
equipamentoRoutes.patch( '/equipamentos/:id', validar(atualizarEquipamentoSchema), atualizarEquipamento)
equipamentoRoutes.delete('/equipamentos/:id', autorizar(Papel.ADM, Papel.Operacional), removerEquipamento)