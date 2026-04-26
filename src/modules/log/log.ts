// // =============================================================
// // FICHEIRO: src/modules/log/log.ts
// // Coloque este ficheiro em: src/modules/log/
// // =============================================================

// // ── Service ──────────────────────────────────────────────────
// import { Papel, Prisma } from '@prisma/client'
// import { prisma }                   from '@/shared/database/prisma.client'
// import { parsePagination, paginar } from '@/shared/utils/index'

// export const LogService = {

//   async listar(query: Record<string, unknown>) {
//     const pagination = parsePagination(query)

//     const where: Prisma.LogWhereInput = {
//       ...(query.usuarioId  && { usuarioId:    query.usuarioId  as string }),
//       ...(query.empresaId  && { empresaId:    query.empresaId  as string }),
//       ...(query.papel      && { nivelUsuario: query.papel      as Papel  }),
//       ...(query.statusHttp && { statusHttp:   parseInt(String(query.statusHttp)) }),
//       ...(query.acao       && {
//         acao: { contains: query.acao as string, mode: 'insensitive' as const },
//       }),
//       ...((query.dataInicio || query.dataFim) && {
//         criadoEm: {
//           ...(query.dataInicio && { gte: new Date(query.dataInicio as string) }),
//           ...(query.dataFim    && { lte: new Date(query.dataFim    as string) }),
//         },
//       }),
//     }

//     const [logs, total] = await prisma.$transaction([
//       prisma.log.findMany({
//         where,
//         skip:    pagination.skip,
//         take:    pagination.take,
//         orderBy: { criadoEm: 'desc' },
//         include: {
//           usuario: { select: { id: true, nome: true, email: true, papel: true } },
//           empresa: { select: { id: true, nome: true } },
//         },
//       }),
//       prisma.log.count({ where }),
//     ])

//     return paginar(logs, total, pagination)
//   },

//   // Chamado internamente pelo logger.middleware.ts
//   async registrar(data: {
//     usuarioId?:   string
//     empresaId?:   string | null
//     nivelUsuario: Papel
//     acao:         string
//     ip?:          string
//     userAgent?:   string
//     statusHttp?:  number
//   }) {
//     return prisma.log.create({ data })
//   },
// }

// // ── Controller ───────────────────────────────────────────────
// import { Request, Response, NextFunction } from 'express'
// import { success } from '@/shared/utils/index'

// export async function listarLogs(req: Request, res: Response, next: NextFunction) {
//   try {
//     return success(res, await LogService.listar(req.query))
//   } catch (e) { next(e) }
// }

// // ── Routes ───────────────────────────────────────────────────
// import { Router } from 'express'
// import { autenticar, autorizar } from '@/shared/middlewares/index'
// import { Papel as PapelEnum }    from '@/shared/types/enums'

// export const logRoutes = Router()

// logRoutes.get('/logs', autenticar, autorizar(PapelEnum.ADM), listarLogs)