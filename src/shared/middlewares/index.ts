// =============================================================
// src/shared/middlewares/index.ts  — re-exporta tudo
// =============================================================
export { autenticar }    from './auth.middleware'
export { autorizar }     from './roles.middleware'
export { escopoEmpresa } from './tenant.middleware'
export { validar }       from './validate.middleware'
export { registrarLog }  from './logger.middleware'
export { tratarErros }   from './error.middleware'



// // =============================================================
// // src/shared/middlewares/auth.middleware.ts
// // Valida JWT e injeta req.user
// // =============================================================
// import { Request, Response, NextFunction } from 'express'
// import jwt from 'jsonwebtoken'
// import { UnauthorizedError } from '@/shared/errors/AppError'
// import { Papel } from '@/shared/types/enums'

// interface JwtPayload {
//   id:        string
//   papel:     Papel
//   empresaId: string | null
// }

// export function autenticar(req: Request, _res: Response, next: NextFunction) {
//   const authHeader = req.headers.authorization
//   if (!authHeader?.startsWith('Bearer ')) {
//     return next(new UnauthorizedError('Token não fornecido'))
//   }

//   const token = authHeader.split(' ')[1]
//   try {
//     const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload
//     req.user = { id: payload.id, papel: payload.papel, empresaId: payload.empresaId }
//     next()
//   } catch {
//     next(new UnauthorizedError('Token inválido ou expirado'))
//   }
// }

// // =============================================================
// // src/shared/middlewares/roles.middleware.ts
// // Autorização por papel
// // =============================================================
// import { ForbiddenError } from '@/shared/errors/AppError'

// export function autorizar(...papeis: Papel[]) {
//   return (req: Request, _res: Response, next: NextFunction) => {
//     if (!req.user || !papeis.includes(req.user.papel)) {
//       return next(new ForbiddenError('Acesso negado para este papel'))
//     }
//     next()
//   }
// }

// // =============================================================
// // src/shared/middlewares/tenant.middleware.ts
// // Garante isolamento multi-tenant para papel Cliente
// // =============================================================
// export function escopoEmpresa(req: Request, _res: Response, next: NextFunction) {
//   if (req.user?.papel === Papel.Cliente && req.user.empresaId) {
//     // Força empresaId da query a ser sempre o da empresa do token
//     req.query.empresaId = req.user.empresaId
//     if (req.params.empresaId) req.params.empresaId = req.user.empresaId
//   }
//   next()
// }

// // =============================================================
// // src/shared/middlewares/validate.middleware.ts
// // Validação de body com Zod
// // =============================================================
// import { ZodSchema } from 'zod'

// export function validar(schema: ZodSchema) {
//   return (req: Request, _res: Response, next: NextFunction) => {
//     const result = schema.safeParse(req.body)
//     if (!result.success) {
//       return _res.status(400).json({
//         success: false,
//         message: 'Dados inválidos',
//         errors:  result.error.flatten().fieldErrors,
//       })
//     }
//     req.body = result.data
//     next()
//   }
// }

// // =============================================================
// // src/shared/middlewares/logger.middleware.ts
// // Regista automaticamente todas as acções autenticadas
// // =============================================================
// import { prisma } from '@/shared/database/prisma.client'

// export function registrarLog(req: Request, res: Response, next: NextFunction) {
//   res.on('finish', async () => {
//     if (!req.user) return
//     try {
//       await prisma.log.create({
//         data: {
//           acao:         `${req.method} ${req.path}`,
//           nivelUsuario: req.user.papel as any,
//           ip:           req.ip,
//           userAgent:    req.headers['user-agent'],
//           statusHttp:   res.statusCode,
//           usuarioId:    req.user.id,
//           empresaId:    req.user.empresaId,
//         },
//       })
//     } catch { /* log nunca deve quebrar a requisição */ }
//   })
//   next()
// }

// // =============================================================
// // src/shared/middlewares/error.middleware.ts
// // Tratamento global de erros
// // =============================================================
// import { AppError } from '@/shared/errors/AppError'
// import { Prisma as PrismaErrors } from '@prisma/client'

// export function tratarErros(
//   err:  Error,
//   _req: Request,
//   res:  Response,
//   _next: NextFunction,
// ) {
//   // Erros de negócio conhecidos
//   if (err instanceof AppError) {
//     return res.status(err.statusCode).json({ success: false, message: err.message })
//   }

//   // Erros do Prisma
//   if (err instanceof PrismaErrors.PrismaClientKnownRequestError) {
//     if (err.code === 'P2002') {
//       return res.status(409).json({ success: false, message: 'Registo duplicado' })
//     }
//     if (err.code === 'P2025') {
//       return res.status(404).json({ success: false, message: 'Recurso não encontrado' })
//     }
//     if (err.code === 'P2003') {
//       return res.status(400).json({ success: false, message: 'Referência inválida' })
//     }
//   }

//   // Erro genérico (não expõe detalhes em produção)
//   console.error('[ERROR]', err)
//   return res.status(500).json({
//     success: false,
//     message: process.env.NODE_ENV === 'production' ? 'Erro interno do servidor' : err.message,
//   })
// }
