// =============================================================
// src/modules/empresa/empresa.schema.ts
// =============================================================
import { z } from 'zod'

export const criarEmpresaSchema = z.object({
  nome:     z.string().min(2),
  cnpj:     z.string().min(14).max(18),
  email:    z.string().email(),
  telefone: z.string().optional(),
})

export const atualizarEmpresaSchema = criarEmpresaSchema.partial().omit({ cnpj: true }).extend({
  status: z.enum(['Ativo', 'Inativo']).optional(),
})

// =============================================================
// src/modules/empresa/empresa.service.ts
// =============================================================
import { Prisma } from '@prisma/client'
import { prisma }           from '@/shared/database/prisma.client'
import { NotFoundError, ConflictError } from '@/shared/errors/AppError'
import { parsePagination, paginar }     from '@/shared/utils/index'

export interface CreateEmpresaDto { nome: string; cnpj: string; email: string; telefone?: string }
export interface UpdateEmpresaDto { nome?: string; email?: string; telefone?: string; status?: 'Ativo' | 'Inativo' }
export interface ListarEmpresasQuery { page?: unknown; limit?: unknown; search?: string; status?: string }

export const EmpresaService = {
  async listar(query: ListarEmpresasQuery) {
    const pagination = parsePagination(query)
    const where: Prisma.EmpresaWhereInput = {
      ...(query.status && { status: query.status as any }),
      ...(query.search && { OR: [
        { nome:  { contains: query.search, mode: 'insensitive' } },
        { cnpj:  { contains: query.search } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ]}),
    }
    const [empresas, total] = await prisma.$transaction([
      prisma.empresa.findMany({
        where, skip: pagination.skip, take: pagination.take,
        orderBy: { criadoEm: 'desc' },
        include: {
          _count:  { select: { funcionarios: true, equipamentos: true } },
          licencas: { orderBy: { expiraEm: 'desc' }, take: 1, select: { plano: true, status: true, expiraEm: true } },
        },
      }),
      prisma.empresa.count({ where }),
    ])
    return paginar(empresas, total, pagination)
  },

  async buscarPorId(id: string) {
    const empresa = await prisma.empresa.findUnique({
      where:   { id },
      include: { licencas: { orderBy: { criadoEm: 'desc' }, take: 1 }, _count: { select: { funcionarios: true, equipamentos: true, alertas: true } } },
    })
    if (!empresa) throw new NotFoundError('Empresa não encontrada')
    return empresa
  },

  async criar(data: CreateEmpresaDto) {
    if (await prisma.empresa.findUnique({ where: { cnpj: data.cnpj } }))   throw new ConflictError('CNPJ já cadastrado')
    if (await prisma.empresa.findUnique({ where: { email: data.email } })) throw new ConflictError('Email já cadastrado')
    return prisma.empresa.create({ data })
  },

  async atualizar(id: string, data: UpdateEmpresaDto) {
    await EmpresaService.buscarPorId(id)
    if (data.email) {
      const existe = await prisma.empresa.findFirst({ where: { email: data.email, NOT: { id } } })
      if (existe) throw new ConflictError('Email já em uso')
    }
    return prisma.empresa.update({ where: { id }, data })
  },

  async desativar(id: string) {
    await EmpresaService.buscarPorId(id)
    return prisma.empresa.update({ where: { id }, data: { status: 'Inativo' } })
  },
}

// =============================================================
// src/modules/empresa/empresa.controller.ts
// =============================================================
import { Request, Response, NextFunction } from 'express'
import { EmpresaService } from './empresa.service'
import { success, created, noContent } from '@/shared/utils/index'

export async function listarEmpresas(req: Request, res: Response, next: NextFunction) {
  try { return success(res, await EmpresaService.listar(req.query)) } catch (e) { next(e) }
}
export async function buscarEmpresa(req: Request, res: Response, next: NextFunction) {
  try { return success(res, await EmpresaService.buscarPorId(req.params.id)) } catch (e) { next(e) }
}
export async function criarEmpresa(req: Request, res: Response, next: NextFunction) {
  try { return created(res, await EmpresaService.criar(req.body)) } catch (e) { next(e) }
}
export async function atualizarEmpresa(req: Request, res: Response, next: NextFunction) {
  try { return success(res, await EmpresaService.atualizar(req.params.id, req.body)) } catch (e) { next(e) }
}
export async function desativarEmpresa(req: Request, res: Response, next: NextFunction) {
  try { await EmpresaService.desativar(req.params.id); return noContent(res) } catch (e) { next(e) }
}

// =============================================================
// src/modules/empresa/empresa.routes.ts
// =============================================================
import { Router }   from 'express'
import { autenticar }    from '@/shared/middlewares/index'
import { autorizar }     from '@/shared/middlewares/index'
import { validar }       from '@/shared/middlewares/index'
import { Papel }         from '@/shared/types/enums'
import { criarEmpresaSchema, atualizarEmpresaSchema } from './empresa.schema'
import { listarEmpresas, buscarEmpresa, criarEmpresa, atualizarEmpresa, desativarEmpresa } from './empresa.controller'

export const empresaRoutes = Router()
empresaRoutes.get(   '/empresas',     autenticar, autorizar(Papel.ADM),                                            listarEmpresas)
empresaRoutes.post(  '/empresas',     autenticar, autorizar(Papel.ADM),  validar(criarEmpresaSchema),              criarEmpresa)
empresaRoutes.get(   '/empresas/:id', autenticar, autorizar(Papel.ADM, Papel.Operacional),                        buscarEmpresa)
empresaRoutes.patch( '/empresas/:id', autenticar, autorizar(Papel.ADM),  validar(atualizarEmpresaSchema),          atualizarEmpresa)
empresaRoutes.delete('/empresas/:id', autenticar, autorizar(Papel.ADM),                                            desativarEmpresa)
