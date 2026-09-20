import { Router } from 'express'
import { validar } from '@/shared/middlewares/validate.middleware'
import { loginRateLimit } from '@/shared/middlewares/rateLimit.middleware'
import { loginSchema, loginTotpSchema } from './auth.schema'
import { login, loginTotp } from './auth.controller'

export const authRoutes = Router()

authRoutes.post('/auth/login', loginRateLimit, validar(loginSchema), login)
authRoutes.post('/auth/login/totp', loginRateLimit, validar(loginTotpSchema), loginTotp)
