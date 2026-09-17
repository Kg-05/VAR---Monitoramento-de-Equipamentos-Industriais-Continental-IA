import { Router } from 'express'
import { validar } from '@/shared/middlewares/validate.middleware'
import { loginSchema } from './auth.schema'
import { login } from './auth.controller'

export const authRoutes = Router()

authRoutes.post('/auth/login', validar(loginSchema), login)