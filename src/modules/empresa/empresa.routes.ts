import { Router }   from 'express'
// import { autenticar }    from '@/shared/middlewares/index'
// import { autorizar }     from '@/shared/middlewares/index'
// import { validar }       from '@/shared/middlewares/index'
import { Papel }         from '@/shared/types/enums'
import { criarEmpresaSchema, atualizarEmpresaSchema } from './empresa.schema'
import { listarEmpresas, buscarEmpresa, criarEmpresa, atualizarEmpresa, desativarEmpresa } from './empresa.controller'

export const empresaRoutes = Router()
empresaRoutes.get(   '/empresas',     listarEmpresas)
empresaRoutes.post(  '/empresas',     criarEmpresa)
empresaRoutes.get(   '/empresas/:id',buscarEmpresa)
empresaRoutes.patch( '/empresas/:id', atualizarEmpresa)
empresaRoutes.delete('/empresas/:id', desativarEmpresa)