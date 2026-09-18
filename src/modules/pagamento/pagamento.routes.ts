import { Router } from 'express'
import { autenticar } from '@/shared/middlewares/auth.middleware'
import { autorizar } from '@/shared/middlewares/roles.middleware'
import { validar } from '@/shared/middlewares/validate.middleware'
import { escopoEmpresa } from '@/shared/middlewares/tenant.middleware'
import { Papel } from '@/shared/types/enums'
import { atualizarPagamento, buscarPagamento, criarPagamento, listarPagamentos } from './pagamento.controller'
import { atualizarPagamentoSchema, criarPagamentoSchema } from './pagamento.schema'

export const pagamentoRoutes = Router()

pagamentoRoutes.use('/pagamentos', autenticar)
pagamentoRoutes.use('/pagamentos', escopoEmpresa)

// Um Cliente pode listar/consultar/criar (submeter) apenas pagamentos
// da própria empresa — o escopo é validado no controller/service.
pagamentoRoutes.get(  '/pagamentos',     listarPagamentos)
pagamentoRoutes.post( '/pagamentos',     validar(criarPagamentoSchema),     criarPagamento)
pagamentoRoutes.get(  '/pagamentos/:id', buscarPagamento)

// Confirmar/reembolsar um pagamento é uma acção administrativa: é o que
// activa/renova a licença, por isso nunca pode ser feito pelo próprio
// Cliente que está a pagar.
pagamentoRoutes.patch(
  '/pagamentos/:id',
  autorizar(Papel.ADM, Papel.Operacional),
  validar(atualizarPagamentoSchema),
  atualizarPagamento,
)