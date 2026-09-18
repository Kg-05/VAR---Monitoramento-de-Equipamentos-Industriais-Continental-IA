import { Router } from 'express'
import { autenticar } from '@/shared/middlewares/auth.middleware'
import { autorizar } from '@/shared/middlewares/roles.middleware'
import { Papel } from '@/shared/types/enums'
import { listarLogs } from './log.controller'

export const logRoutes = Router()

logRoutes.use('/logs', autenticar)
logRoutes.use('/logs', autorizar(Papel.ADM, Papel.Operacional))

logRoutes.get('/logs', listarLogs)