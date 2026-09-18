import { Router } from 'express'
import { autenticar } from '@/shared/middlewares/auth.middleware'
import { autorizar } from '@/shared/middlewares/roles.middleware'
import { Papel } from '@/shared/types/enums'
import { relatorioAlertas, relatorioEquipamentos, relatorioFinanceiro, relatorioLicencas } from './relatorio.controller'

export const relatorioRoutes = Router()

relatorioRoutes.use('/relatorios', autenticar)
relatorioRoutes.use('/relatorios', autorizar(Papel.ADM, Papel.Operacional))

relatorioRoutes.get('/relatorios/alertas',      relatorioAlertas)

relatorioRoutes.get('/relatorios/equipamentos', relatorioEquipamentos)

relatorioRoutes.get('/relatorios/financeiro',   relatorioFinanceiro)

relatorioRoutes.get('/relatorios/licencas',     relatorioLicencas)