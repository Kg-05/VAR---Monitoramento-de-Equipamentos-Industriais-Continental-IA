// src/modules/equipamento/equipamento.routes.ts
import { Router }    from 'express'
import { autenticar } from '@/shared/middlewares/auth.middleware'
import { autorizar } from '@/shared/middlewares/roles.middleware'
import { validar } from '@/shared/middlewares/validate.middleware'
import { escopoEmpresa } from '@/shared/middlewares/tenant.middleware'
import { Papel }     from '@/shared/types/enums'
import { criarEquipamentoSchema, atualizarEquipamentoSchema } from './equipamento.schema'
import {
  listarEquipamentos,
  buscarEquipamento,
  criarEquipamento,
  atualizarEquipamento,
  removerEquipamento,
} from './equipamento.controller'

export const equipamentoRoutes = Router()

equipamentoRoutes.use(autenticar as any)
equipamentoRoutes.use(escopoEmpresa as any)

equipamentoRoutes.get(   '/equipamentos',     listarEquipamentos as any)
equipamentoRoutes.post(  '/equipamentos',     validar(criarEquipamentoSchema) as any,     criarEquipamento as any)
equipamentoRoutes.get(   '/equipamentos/:id', buscarEquipamento as any)
equipamentoRoutes.patch( '/equipamentos/:id', validar(atualizarEquipamentoSchema) as any, atualizarEquipamento as any)
equipamentoRoutes.delete('/equipamentos/:id', autorizar(Papel.ADM, Papel.Operacional) as any, removerEquipamento as any)