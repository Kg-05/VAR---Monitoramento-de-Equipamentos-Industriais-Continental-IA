// // =============================================================
// // src/modules/funcionario/funcionario.schema.ts
// // =============================================================
// import { z } from 'zod'

// export const criarFuncionarioSchema = z.object({
//   nome:      z.string().min(2),
//   email:     z.string().email(),
//   cargo:     z.string().min(2),
//   telefone:  z.string().optional(),
//   empresaId: z.string().uuid().optional(), // preenchido pelo middleware de escopo se Cliente
// })

// export const atualizarFuncionarioSchema = criarFuncionarioSchema.partial().extend({
//   status: z.enum(['Ativo', 'Inativo', 'Pendente']).optional(),
// })

// // =============================================================
// // src/modules/funcionario/funcionario.service.ts
// // =============================================================
// import { StatusFuncionario, Prisma } from '@prisma/client'
// import { prisma }           from '@/shared/database/prisma.client'
// import { NotFoundError, ConflictError } from '@/shared/errors/AppError'
// import { parsePagination, paginar }     from '@/shared/utils/index'
// import { LicencaService }  from '@/modules/licenca/licenca.service'

// export const FuncionarioService = {
//   async listar(query: Record<string, unknown>) {
//     const pagination = parsePagination(query)
//     const where: Prisma.FuncionarioWhereInput = {
//       ...(query.empresaId && { empresaId: query.empresaId as string }),
//       ...(query.status    && { status:    query.status as StatusFuncionario }),
//       ...(query.search    && { OR: [
//         { nome:  { contains: query.search as string, mode: 'insensitive' } },
//         { email: { contains: query.search as string, mode: 'insensitive' } },
//         { cargo: { contains: query.search as string, mode: 'insensitive' } },
//       ]}),
//     }
//     const [funcionarios, total] = await prisma.$transaction([
//       prisma.funcionario.findMany({ where, skip: pagination.skip, take: pagination.take, orderBy: { criadoEm: 'desc' }, include: { empresa: { select: { id: true, nome: true } } } }),
//       prisma.funcionario.count({ where }),
//     ])
//     return paginar(funcionarios, total, pagination)
//   },

//   async buscarPorId(id: string, empresaId?: string) {
//     const f = await prisma.funcionario.findUnique({ where: { id }, include: { empresa: { select: { id: true, nome: true } } } })
//     if (!f) throw new NotFoundError('Funcionário não encontrado')
//     if (empresaId && f.empresaId !== empresaId) throw new NotFoundError('Funcionário não encontrado')
//     return f
//   },

//   async criar(data: { empresaId: string; nome: string; email: string; cargo: string; telefone?: string }) {
//     await LicencaService.verificarLimiteFuncionarios(data.empresaId)
//     if (await prisma.funcionario.findFirst({ where: { email: data.email, empresaId: data.empresaId } })) throw new ConflictError('Email já cadastrado nesta empresa')
//     return prisma.funcionario.create({ data, include: { empresa: { select: { id: true, nome: true } } } })
//   },

//   async atualizar(id: string, data: Partial<{ nome: string; email: string; cargo: string; telefone: string; status: StatusFuncionario }>, empresaId?: string) {
//     const f = await FuncionarioService.buscarPorId(id, empresaId)
//     if (data.email && data.email !== f.email) {
//       if (await prisma.funcionario.findFirst({ where: { email: data.email, empresaId: f.empresaId, NOT: { id } } })) throw new ConflictError('Email já em uso')
//     }
//     return prisma.funcionario.update({ where: { id }, data })
//   },

//   async desativar(id: string, empresaId?: string) {
//     await FuncionarioService.buscarPorId(id, empresaId)
//     return prisma.funcionario.update({ where: { id }, data: { status: StatusFuncionario.Inativo } })
//   },
// }

// // =============================================================
// // src/modules/funcionario/funcionario.controller.ts
// // =============================================================
// import { Request, Response, NextFunction } from 'express'
// import { FuncionarioService } from './funcionario.service'
// import { success, created, noContent } from '@/shared/utils/index'

// export async function listarFuncionarios(req: Request, res: Response, next: NextFunction) {
//   try { return success(res, await FuncionarioService.listar(req.query)) } catch (e) { next(e) }
// }
// export async function buscarFuncionario(req: Request, res: Response, next: NextFunction) {
//   try { return success(res, await FuncionarioService.buscarPorId(req.params.id, req.user?.empresaId ?? undefined)) } catch (e) { next(e) }
// }
// export async function criarFuncionario(req: Request, res: Response, next: NextFunction) {
//   try {
//     const empresaId = req.user?.papel === 'Cliente' ? req.user.empresaId! : req.body.empresaId
//     return created(res, await FuncionarioService.criar({ ...req.body, empresaId }))
//   } catch (e) { next(e) }
// }
// export async function atualizarFuncionario(req: Request, res: Response, next: NextFunction) {
//   try { return success(res, await FuncionarioService.atualizar(req.params.id, req.body, req.user?.empresaId ?? undefined)) } catch (e) { next(e) }
// }
// export async function desativarFuncionario(req: Request, res: Response, next: NextFunction) {
//   try { await FuncionarioService.desativar(req.params.id, req.user?.empresaId ?? undefined); return noContent(res) } catch (e) { next(e) }
// }

// // =============================================================
// // src/modules/funcionario/funcionario.routes.ts
// // =============================================================
// import { Router } from 'express'
// import { autenticar, autorizar, validar, escopoEmpresa } from '@/shared/middlewares/index'
// import { Papel } from '@/shared/types/enums'
// import { criarFuncionarioSchema, atualizarFuncionarioSchema } from './funcionario.schema'
// import { listarFuncionarios, buscarFuncionario, criarFuncionario, atualizarFuncionario, desativarFuncionario } from './funcionario.controller'

// export const funcionarioRoutes = Router()
// funcionarioRoutes.use(autenticar, escopoEmpresa)
// funcionarioRoutes.get(   '/funcionarios',     listarFuncionarios)
// funcionarioRoutes.post(  '/funcionarios',     validar(criarFuncionarioSchema),     criarFuncionario)
// funcionarioRoutes.get(   '/funcionarios/:id', buscarFuncionario)
// funcionarioRoutes.patch( '/funcionarios/:id', validar(atualizarFuncionarioSchema), atualizarFuncionario)
// funcionarioRoutes.delete('/funcionarios/:id', desativarFuncionario)