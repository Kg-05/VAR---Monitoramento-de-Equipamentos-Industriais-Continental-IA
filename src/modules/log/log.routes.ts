import { Router } from 'express'
import { autenticar } from '@/shared/middlewares/auth.middleware'
import { escopoEmpresa } from '@/shared/middlewares/tenant.middleware'
import { listarLogs } from './log.controller'

export const logRoutes = Router()

// Qualquer papel autenticado pode ler os logs — um Cliente vê apenas a
// trilha de auditoria da própria empresa, imposta pelo escopoEmpresa
// (que sobrescreve query.empresaId com a empresa do utilizador).
logRoutes.use('/logs', autenticar)
logRoutes.use('/logs', escopoEmpresa)

logRoutes.get('/logs', listarLogs)