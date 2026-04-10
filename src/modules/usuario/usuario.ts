// =============================================================
// src/modules/usuario/usuario.schema.ts
// =============================================================
import { z } from 'zod'

export const criarUsuarioSchema = z.object({
  email:     z.string().email(),
  nome:      z.string().min(2),
  senha:     z.string().min(6),
  papel:     z.enum(['ADM', 'Operacional', 'Cliente']),
  empresaId: z.string().uuid().optional(),
})

export const atualizarUsuarioSchema = z.object({
  nome:   z.string().min(2).optional(),
  email:  z.string().email().optional(),
  status: z.enum(['Ativo', 'Inativo']).optional(),
})

// =============================================================
// src/modules/usuario/usuario.service.ts
// =============================================================
import { Papel, Prisma } from '@prisma/client'
import { prisma }           from '@/shared/database/prisma.client'
import { NotFoundError, ConflictError, ForbiddenError } from '@/shared/errors/AppError'
import { hashSenha, parsePagination, paginar }          from '@/shared/utils/index'

const semSenha = { senhaHash: false } as const

export const UsuarioService = {
  async listar(query: Record<string, unknown>) {
    const pagination = parsePagination(query)
    const where: Prisma.UsuarioWhereInput = {
      ...(query.papel     && { papel:     query.papel as Papel }),
      ...(query.empresaId && { empresaId: query.empresaId as string }),
      ...(query.search    && { OR: [
        { nome:  { contains: query.search as string, mode: 'insensitive' } },
        { email: { contains: query.search as string, mode: 'insensitive' } },
      ]}),
    }
    const [usuarios, total] = await prisma.$transaction([
      prisma.usuario.findMany({ where, skip: pagination.skip, take: pagination.take, orderBy: { criadoEm: 'desc' }, omit: semSenha, include: { empresa: { select: { id: true, nome: true } } } }),
      prisma.usuario.count({ where }),
    ])
    return paginar(usuarios, total, pagination)
  },

  async buscarPorId(id: string) {
    const u = await prisma.usuario.findUnique({ where: { id }, omit: semSenha, include: { empresa: { select: { id: true, nome: true } } } })
    if (!u) throw new NotFoundError('Usuário não encontrado')
    return u
  },

  async criar(data: { email: string; nome: string; senha: string; papel: Papel; empresaId?: string }, solicitantePapel: Papel) {
    if (solicitantePapel === Papel.Operacional && data.papel !== Papel.Cliente) throw new ForbiddenError('Operacional só pode criar usuários do tipo Cliente')
    if (data.papel === Papel.Cliente && !data.empresaId) throw new ConflictError('Usuário Cliente precisa de empresa vinculada')
    if (await prisma.usuario.findUnique({ where: { email: data.email } })) throw new ConflictError('Email já cadastrado')
    if (data.empresaId && !await prisma.empresa.findUnique({ where: { id: data.empresaId } })) throw new NotFoundError('Empresa não encontrada')
    const { senha, ...resto } = data
    return prisma.usuario.create({ data: { ...resto, senhaHash: await hashSenha(senha) }, omit: semSenha })
  },

  async atualizar(id: string, data: { nome?: string; email?: string; status?: string }) {
    await UsuarioService.buscarPorId(id)
    if (data.email) {
      if (await prisma.usuario.findFirst({ where: { email: data.email, NOT: { id } } })) throw new ConflictError('Email já em uso')
    }
    return prisma.usuario.update({ where: { id }, data, omit: semSenha })
  },

  async desativar(id: string) {
    await UsuarioService.buscarPorId(id)
    return prisma.usuario.update({ where: { id }, data: { status: 'Inativo' }, omit: semSenha })
  },

  async buscarPorEmailComSenha(email: string) {
    return prisma.usuario.findUnique({ where: { email } })
  },
}

// =============================================================
// src/modules/usuario/usuario.controller.ts
// =============================================================
import { Request, Response, NextFunction } from 'express'
import { UsuarioService } from './usuario.service'
import { success, created, noContent } from '@/shared/utils/index'

export async function listarUsuarios(req: Request, res: Response, next: NextFunction) {
  try { return success(res, await UsuarioService.listar(req.query)) } catch (e) { next(e) }
}
export async function buscarUsuario(req: Request, res: Response, next: NextFunction) {
  try { return success(res, await UsuarioService.buscarPorId(req.params.id)) } catch (e) { next(e) }
}
export async function criarUsuario(req: Request, res: Response, next: NextFunction) {
  try { return created(res, await UsuarioService.criar(req.body, req.user!.papel as Papel)) } catch (e) { next(e) }
}
export async function atualizarUsuario(req: Request, res: Response, next: NextFunction) {
  try { return success(res, await UsuarioService.atualizar(req.params.id, req.body)) } catch (e) { next(e) }
}
export async function desativarUsuario(req: Request, res: Response, next: NextFunction) {
  try { await UsuarioService.desativar(req.params.id); return noContent(res) } catch (e) { next(e) }
}

// =============================================================
// src/modules/usuario/usuario.routes.ts
// =============================================================
import { Router } from 'express'
import { autenticar, autorizar, validar } from '@/shared/middlewares/index'
import { criarUsuarioSchema, atualizarUsuarioSchema } from './usuario.schema'
import { listarUsuarios, buscarUsuario, criarUsuario, atualizarUsuario, desativarUsuario } from './usuario.controller'

export const usuarioRoutes = Router()
usuarioRoutes.get(   '/usuarios',     autenticar, autorizar(Papel.ADM, Papel.Operacional),                        listarUsuarios)
usuarioRoutes.post(  '/usuarios',     autenticar, autorizar(Papel.ADM, Papel.Operacional), validar(criarUsuarioSchema), criarUsuario)
usuarioRoutes.get(   '/usuarios/:id', autenticar,                                                                 buscarUsuario)
usuarioRoutes.patch( '/usuarios/:id', autenticar, autorizar(Papel.ADM, Papel.Operacional), validar(atualizarUsuarioSchema), atualizarUsuario)
usuarioRoutes.delete('/usuarios/:id', autenticar, autorizar(Papel.ADM),                                           desativarUsuario)
