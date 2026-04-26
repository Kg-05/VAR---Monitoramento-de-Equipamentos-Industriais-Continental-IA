import { Router } from 'express'
// import { autenticar, autorizar } from '@/shared/middlewares/index'
import { Papel as PapelEnum }    from '@/shared/types/enums'
import { listarLogs } from './log.controller'

export const logRoutes = Router()

logRoutes.get('/logs', listarLogs)