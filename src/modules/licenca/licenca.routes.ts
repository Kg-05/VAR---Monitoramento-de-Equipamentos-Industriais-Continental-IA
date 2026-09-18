import { Router } from 'express'
import { autenticar } from '@/shared/middlewares/auth.middleware'
import { autorizar } from '@/shared/middlewares/roles.middleware'
import { validar } from '@/shared/middlewares/validate.middleware'
import { escopoEmpresa } from '@/shared/middlewares/tenant.middleware'
import { Papel } from '@/shared/types/enums'
import { criarLicencaSchema, atualizarLicencaSchema } from './licenca.schema'
import { listarLicencas, criarLicenca, buscarLicenca, atualizarLicenca } from './licenca.controller'

export const licencaRoutes = Router()

licencaRoutes.use('/licencas', autenticar)
licencaRoutes.use('/licencas', escopoEmpresa)

// Um Cliente pode listar/consultar/criar (auto-compra) apenas a licença
// da própria empresa — o escopo é validado no controller/service.
licencaRoutes.get(  '/licencas',     listarLicencas)
licencaRoutes.post( '/licencas',     validar(criarLicencaSchema),     criarLicenca)
licencaRoutes.get(  '/licencas/:id', buscarLicenca)

// Alterar o status de uma licença (activar, suspender, etc.) é uma
// acção administrativa — nunca feita directamente pelo Cliente.
licencaRoutes.patch(
  '/licencas/:id',
  autorizar(Papel.ADM, Papel.Operacional),
  validar(atualizarLicencaSchema),
  atualizarLicenca,
)