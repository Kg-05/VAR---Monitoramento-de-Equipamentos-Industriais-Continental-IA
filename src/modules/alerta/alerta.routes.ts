import { Router } from 'express'

import { Papel } from '@/shared/types/enums'
import { criarAlertaSchema } from './alerta.schema'
import { listarAlertas, buscarAlerta, criarAlerta, marcarAlertaLido, removerAlerta, resumoAlertas, alertasNaoLidos } from './alerta.controller'
// import { autenticar } from '@/shared/middlewares/auth.middleware'
// import { autorizar } from '@/shared/middlewares/roles.middleware'
// import { escopoEmpresa } from '@/shared/middlewares/tenant.middleware'
// import { validar } from '@/shared/middlewares/validate.middleware'

export const alertaRoutes = Router()
// alertaRoutes.use(autenticar, escopoEmpresa)
alertaRoutes.get(   '/alertas/resumo',       resumoAlertas)
alertaRoutes.get(   '/alertas/nao-lidos',    alertasNaoLidos)
alertaRoutes.get(   '/alertas',              listarAlertas)
alertaRoutes.post(  '/alertas',              criarAlerta)
alertaRoutes.get(   '/alertas/:id',          buscarAlerta)
alertaRoutes.patch( '/alertas/:id/ler',      marcarAlertaLido)
alertaRoutes.delete('/alertas/:id',          removerAlerta)
