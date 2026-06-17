// src/modules/documento/documento.routes.ts
import { Router } from 'express'
import { uploadDocumento } from '@/shared/middlewares/upload.middleware'
import {
  listarDocumentos,
  criarDocumento,
  marcarLidoDocumento,
  arquivarDocumento,
  removerDocumento,
  resumoDocumentos,
} from './documento.controller'

export const documentoRoutes = Router()

documentoRoutes.get(   '/documentos/resumo',     resumoDocumentos)
documentoRoutes.get(   '/documentos',            listarDocumentos)
documentoRoutes.post(  '/documentos',            uploadDocumento.single('arquivo'), criarDocumento)
documentoRoutes.patch( '/documentos/:id/lido',   marcarLidoDocumento)
documentoRoutes.patch( '/documentos/:id/arquivar', arquivarDocumento)
documentoRoutes.delete('/documentos/:id',        removerDocumento)