// src/modules/documento/documento.routes.ts
import { Router } from 'express'

import { autenticar } from '@/shared/middlewares/auth.middleware'
import { autorizar } from '@/shared/middlewares/roles.middleware'
import { validar } from '@/shared/middlewares/validate.middleware'
import { escopoEmpresa } from '@/shared/middlewares/tenant.middleware'
import { uploadDocumento } from '@/shared/middlewares/upload.middleware'
import { Papel } from '@/shared/types/enums'

import { criarDocumentoSchema } from './documento.schema'

import {
  listarDocumentos,
  criarDocumento,
  marcarLidoDocumento,
  arquivarDocumento,
  removerDocumento,
  resumoDocumentos,
} from './documento.controller'

export const documentoRoutes = Router()

/**
 * Todas as operações de documentos exigem autenticação
 * e respeitam o escopo da empresa do utilizador.
 */
documentoRoutes.use('/documentos', autenticar)
documentoRoutes.use('/documentos', escopoEmpresa)

documentoRoutes.get(   '/documentos/resumo',       resumoDocumentos)
documentoRoutes.get(   '/documentos',              listarDocumentos)
documentoRoutes.post(  '/documentos',              uploadDocumento.single('arquivo'), validar(criarDocumentoSchema), criarDocumento)
documentoRoutes.patch( '/documentos/:id/lido',     marcarLidoDocumento)
documentoRoutes.patch( '/documentos/:id/arquivar', arquivarDocumento)
documentoRoutes.delete('/documentos/:id',          autorizar(Papel.ADM, Papel.Operacional), removerDocumento)
