import { Router }   from 'express'
// import { validar }  from '@/shared/middlewares/index'
import { loginSchema } from './auth.schema'
import { login }    from './auth.controller'

export const authRoutes = Router()

authRoutes.post('/auth/login', login)