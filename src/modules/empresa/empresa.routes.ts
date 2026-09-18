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

empresaRoutes.get(
  '/empresas/dashboard/resumo',
  autorizar(Papel.ADM, Papel.Operacional),
  resumoDashboard,
)

empresaRoutes.get(
  '/empresas',
  autorizar(Papel.ADM, Papel.Operacional),
  listarEmpresas,
)

empresaRoutes.post(
  '/empresas',
  autorizar(Papel.ADM, Papel.Operacional),
  validar(criarEmpresaSchema),
  criarEmpresa,
)

// Um Cliente pode consultar apenas os dados da própria empresa
// (o escopo é validado em EmpresaService.buscarPorId).
empresaRoutes.get(
  '/empresas/:id',
  buscarEmpresa,
)

empresaRoutes.patch(
  '/empresas/:id',
  autorizar(Papel.ADM, Papel.Operacional),
  validar(atualizarEmpresaSchema),
  atualizarEmpresa,
)

empresaRoutes.patch(
  '/empresas/:id/ativar',
  autorizar(Papel.ADM, Papel.Operacional),
  ativarEmpresa,
)

empresaRoutes.delete(
  '/empresas/:id',
  autorizar(Papel.ADM, Papel.Operacional),
  desativarEmpresa,
)