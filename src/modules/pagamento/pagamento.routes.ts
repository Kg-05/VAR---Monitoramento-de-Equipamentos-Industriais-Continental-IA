import { Router } from 'express'
// import { autenticar, autorizar, validar } from '@/shared/middlewares/index'
import { Papel } from '@/shared/types/enums'
import { atualizarPagamento, buscarPagamento, criarPagamento, listarPagamentos } from './pagamento.controller'
import { atualizarPagamentoSchema, criarPagamentoSchema } from './pagamento.schema'

export const pagamentoRoutes = Router()

pagamentoRoutes.get(  '/pagamentos',listarPagamentos)

pagamentoRoutes.post( '/pagamentos',criarPagamento)

pagamentoRoutes.get(  '/pagamentos/:id',buscarPagamento)

pagamentoRoutes.patch('/pagamentos/:id',atualizarPagamento)