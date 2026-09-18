import { Router } from 'express'
import { autenticar } from '@/shared/middlewares/auth.middleware'
import { autorizar } from '@/shared/middlewares/roles.middleware'
import { validar } from '@/shared/middlewares/validate.middleware'
import { Papel } from '@/shared/types/enums'
import { criarLicencaSchema, atualizarLicencaSchema } from './licenca.schema'
import { listarLicencas, criarLicenca, buscarLicenca, atualizarLicenca } from './licenca.controller'

export const licencaRoutes = Router()

licencaRoutes.use('/licencas', autenticar)
licencaRoutes.use('/licencas', autorizar(Papel.ADM, Papel.Operacional))

licencaRoutes.get(  '/licencas',     listarLicencas)
licencaRoutes.post( '/licencas',     validar(criarLicencaSchema),     criarLicenca)
licencaRoutes.get(  '/licencas/:id', buscarLicenca)
licencaRoutes.patch('/licencas/:id', validar(atualizarLicencaSchema), atualizarLicenca)