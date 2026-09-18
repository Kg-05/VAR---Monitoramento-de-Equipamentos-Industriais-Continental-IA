import { Router } from 'express'
import { autenticar } from '@/shared/middlewares/auth.middleware'
import { autorizar } from '@/shared/middlewares/roles.middleware'
import { validar } from '@/shared/middlewares/validate.middleware'
import { uploadImagem } from '@/shared/middlewares/upload.middleware'
import { Papel } from '@/shared/types/enums'
import { atualizarPlataformaSchema } from './plataforma.schema'
import { obterPlataforma, atualizarPlataforma, atualizarLogotipo } from './plataforma.controller'

export const plataformaRoutes = Router()

plataformaRoutes.use('/plataforma', autenticar)

plataformaRoutes.get(   '/plataforma',           obterPlataforma)
plataformaRoutes.patch( '/plataforma',           autorizar(Papel.ADM), validar(atualizarPlataformaSchema), atualizarPlataforma)
plataformaRoutes.patch( '/plataforma/logotipo',  autorizar(Papel.ADM), uploadImagem.single('logotipo'), atualizarLogotipo)
