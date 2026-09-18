import { Router } from 'express'
import { autenticar } from '@/shared/middlewares/auth.middleware'
import { autorizar } from '@/shared/middlewares/roles.middleware'
import { validar } from '@/shared/middlewares/validate.middleware'
import { Papel } from '@/shared/types/enums'
import { atualizarPagamento, buscarPagamento, criarPagamento, listarPagamentos } from './pagamento.controller'
import { atualizarPagamentoSchema, criarPagamentoSchema } from './pagamento.schema'

export const pagamentoRoutes = Router()

pagamentoRoutes.use('/pagamentos', autenticar)
pagamentoRoutes.use('/pagamentos', autorizar(Papel.ADM, Papel.Operacional))

pagamentoRoutes.get(  '/pagamentos',     listarPagamentos)

pagamentoRoutes.post( '/pagamentos',     validar(criarPagamentoSchema),     criarPagamento)

pagamentoRoutes.get(  '/pagamentos/:id', buscarPagamento)

pagamentoRoutes.patch('/pagamentos/:id', validar(atualizarPagamentoSchema), atualizarPagamento)