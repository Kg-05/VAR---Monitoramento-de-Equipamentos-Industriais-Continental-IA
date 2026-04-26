import { Router } from 'express'
// import { autenticar, autorizar, escopoEmpresa } from '@/shared/middlewares/index'
import { Papel } from '@/shared/types/enums'
import { relatorioAlertas, relatorioEquipamentos, relatorioFinanceiro, relatorioLicencas } from './relatorio.controller'

export const relatorioRoutes = Router()

relatorioRoutes.get('/relatorios/alertas',relatorioAlertas)

relatorioRoutes.get('/relatorios/equipamentos',relatorioEquipamentos)

relatorioRoutes.get('/relatorios/financeiro',relatorioFinanceiro)

relatorioRoutes.get('/relatorios/licencas',relatorioLicencas)