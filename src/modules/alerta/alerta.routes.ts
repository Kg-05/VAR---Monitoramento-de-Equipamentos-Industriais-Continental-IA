import { Router } from 'express'

import { Papel } from '@/shared/types/enums'
import { autenticar } from '@/shared/middlewares/auth.middleware'
import { autorizar } from '@/shared/middlewares/roles.middleware'
import { validar } from '@/shared/middlewares/validate.middleware'
import { escopoEmpresa } from '@/shared/middlewares/tenant.middleware'

import { criarAlertaSchema, atualizarAlertaSchema } from './alerta.schema'

import {
  listarAlertas,
  buscarAlerta,
  criarAlerta,
  atualizarAlerta,
  marcarAlertaLido,
  removerAlerta,
  resumoAlertas,
  alertasNaoLidos,
} from './alerta.controller'

export const alertaRoutes = Router()

/**
 * Todas as operações de alertas exigem autenticação
 * e respeitam o escopo da empresa do utilizador.
 */
alertaRoutes.use('/alertas', autenticar)
alertaRoutes.use('/alertas', escopoEmpresa)

alertaRoutes.get(
  '/alertas/resumo',
  resumoAlertas,
)

alertaRoutes.get(
  '/alertas/nao-lidos',
  alertasNaoLidos,
)

alertaRoutes.get(
  '/alertas',
  listarAlertas,
)

alertaRoutes.post(
  '/alertas',
  validar(criarAlertaSchema),
  criarAlerta,
)

alertaRoutes.get(
  '/alertas/:id',
  buscarAlerta,
)

alertaRoutes.patch(
  '/alertas/:id',
  validar(atualizarAlertaSchema),
  atualizarAlerta,
)

alertaRoutes.patch(
  '/alertas/:id/ler',
  marcarAlertaLido,
)

alertaRoutes.delete(
  '/alertas/:id',
  autorizar(Papel.ADM, Papel.Operacional),
  removerAlerta,
)
