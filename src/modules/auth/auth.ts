// // =============================================================
// // src/modules/auth/auth.schema.ts
// // =============================================================
// import { z } from 'zod'

// export const loginSchema = z.object({
//   email: z.string().email('Email inválido'),
//   senha: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
// })

// export type LoginDto = z.infer<typeof loginSchema>

// // =============================================================
// // src/modules/auth/auth.service.ts
// // =============================================================
// import jwt from 'jsonwebtoken'
// import { prisma }           from '@/shared/database/prisma.client'
// import { verificarSenha }   from '@/shared/utils/index'
// import { UnauthorizedError } from '@/shared/errors/AppError'
// import type { LoginDto }    from './auth.schema'

// export const AuthService = {
//   async login(data: LoginDto) {
//     const usuario = await prisma.usuario.findUnique({ where: { email: data.email } })

//     if (!usuario || usuario.status === 'Inativo') {
//       throw new UnauthorizedError('Credenciais inválidas')
//     }

//     const senhaValida = await verificarSenha(data.senha, usuario.senhaHash)
//     if (!senhaValida) {
//       throw new UnauthorizedError('Credenciais inválidas')
//     }

//     const payload = {
//       id:        usuario.id,
//       papel:     usuario.papel,
//       empresaId: usuario.empresaId,
//     }

//     const token = jwt.sign(payload, process.env.JWT_SECRET!, {
//       expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
//     } as jwt.SignOptions)

//     return {
//       token,
//       usuario: {
//         id:        usuario.id,
//         nome:      usuario.nome,
//         email:     usuario.email,
//         papel:     usuario.papel,
//         empresaId: usuario.empresaId,
//       },
//     }
//   },
// }

// // =============================================================
// // src/modules/auth/auth.controller.ts
// // =============================================================
// import { Request, Response, NextFunction } from 'express'
// import { AuthService } from './auth.service'
// import { success }     from '@/shared/utils/index'

// export async function login(req: Request, res: Response, next: NextFunction) {
//   try {
//     const result = await AuthService.login(req.body)
//     return success(res, result)
//   } catch (err) { next(err) }
// }

// // =============================================================
// // src/modules/auth/auth.routes.ts
// // =============================================================
// import { Router }   from 'express'
// import { validar }  from '@/shared/middlewares/index'
// import { loginSchema } from './auth.schema'
// import { login }    from './auth.controller'

// export const authRoutes = Router()

// authRoutes.post('/auth/login', validar(loginSchema), login)
