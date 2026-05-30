import { Router } from 'express'
import { listarEmpresas, buscarEmpresa, criarEmpresa, atualizarEmpresa, desativarEmpresa, ativarEmpresa, resumoDashboard } from './empresa.controller'

export const empresaRoutes = Router()

empresaRoutes.get(   '/empresas/dashboard/resumo',  resumoDashboard)
empresaRoutes.get(   '/empresas',                   listarEmpresas)
empresaRoutes.post(  '/empresas',                   criarEmpresa)
empresaRoutes.get(   '/empresas/:id',               buscarEmpresa)
empresaRoutes.patch( '/empresas/:id',               atualizarEmpresa)
empresaRoutes.patch( '/empresas/:id/ativar',        ativarEmpresa)
empresaRoutes.delete('/empresas/:id',               desativarEmpresa)