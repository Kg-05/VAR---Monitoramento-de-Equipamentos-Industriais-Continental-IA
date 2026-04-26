import { Router } from 'express'
// import { autenticar, autorizar, validar } from '@/shared/middlewares/index'
import { Papel } from '@/shared/types/enums'
import { criarLicencaSchema, atualizarLicencaSchema } from './licenca.service'
import { listarLicencas, criarLicenca, buscarLicenca, atualizarLicenca } from './licenca.controller'

export const licencaRoutes = Router()
licencaRoutes.get(  '/licencas',     listarLicencas)
licencaRoutes.post( '/licencas',     criarLicenca)
licencaRoutes.get(  '/licencas/:id', buscarLicenca)
licencaRoutes.patch('/licencas/:id', atualizarLicenca)