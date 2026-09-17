import { Router } from 'express'

import { autenticar } from '@/shared/middlewares/auth.middleware'
import { autorizar } from '@/shared/middlewares/roles.middleware'
import { validar } from '@/shared/middlewares/validate.middleware'
import { Papel } from '@/shared/types/enums'

import {
  criarEmpresaSchema,
  atualizarEmpresaSchema,
} from './empresa.schema'

import {
  listarEmpresas,
  buscarEmpresa,
  criarEmpresa,
  atualizarEmpresa,
  desativarEmpresa,
  ativarEmpresa,
  resumoDashboard,
} from './empresa.controller'

export const empresaRoutes = Router()

empresaRoutes.use('/empresas', autenticar)
empresaRoutes.use('/empresas', autorizar(Papel.ADM, Papel.Operacional))

empresaRoutes.get(
  '/empresas/dashboard/resumo',
  resumoDashboard,
)

empresaRoutes.get(
  '/empresas',
  listarEmpresas,
)

empresaRoutes.post(
  '/empresas',
  validar(criarEmpresaSchema),
  criarEmpresa,
)

empresaRoutes.get(
  '/empresas/:id',
  buscarEmpresa,
)

empresaRoutes.patch(
  '/empresas/:id',
  validar(atualizarEmpresaSchema),
  atualizarEmpresa,
)

empresaRoutes.patch(
  '/empresas/:id/ativar',
  ativarEmpresa,
)

empresaRoutes.delete(
  '/empresas/:id',
  desativarEmpresa,
)