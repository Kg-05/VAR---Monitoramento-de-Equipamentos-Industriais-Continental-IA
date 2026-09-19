import { Router } from 'express'
import { validar } from '@/shared/middlewares/validate.middleware'
import { loginSchema, loginTotpSchema } from './auth.schema'
import { login, loginTotp } from './auth.controller'

export const authRoutes = Router()

authRoutes.post('/auth/login', validar(loginSchema), login)
authRoutes.post('/auth/login/totp', validar(loginTotpSchema), loginTotp)
