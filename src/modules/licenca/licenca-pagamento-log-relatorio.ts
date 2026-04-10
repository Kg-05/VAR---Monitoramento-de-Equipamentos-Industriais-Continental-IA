// =============================================================
// src/modules/licenca/licenca.service.ts
// =============================================================
import { PlanoLicenca, StatusLicenca, Prisma } from '@prisma/client'
import { prisma }           from '@/shared/database/prisma.client'
import { NotFoundError, ConflictError, LicencaInvalidaError } from '@/shared/errors/AppError'
import { calcularStatusLicenca, diasParaExpirar, parsePagination, paginar } from '@/shared/utils/index'
import { z } from 'zod'

export const criarLicencaSchema = z.object({
  empresaId:         z.string().uuid(),
  plano:             z.enum(['Basico', 'Profissional', 'Premium']),
  maxDeFuncionarios: z.number().int().positive(),
  inicioEm:          z.coerce.date(),
  expiraEm:          z.coerce.date(),
  observacoes:       z.string().optional(),
})
export const atualizarLicencaSchema = criarLicencaSchema.partial().extend({
  status: z.enum(['Ativa', 'Expirada', 'Suspensa']).optional(),
})

export const LicencaService = {
  async listar(query: Record<string, unknown>) {
    const pagination = parsePagination(query)
    const where: Prisma.LicencaWhereInput = {
      ...(query.empresaId && { empresaId: query.empresaId as string }),
      ...(query.plano     && { plano:     query.plano as PlanoLicenca }),
    }
    const [licencas, total] = await prisma.$transaction([
      prisma.licenca.findMany({ where, skip: pagination.skip, take: pagination.take, orderBy: { criadoEm: 'desc' }, include: { empresa: { select: { id: true, nome: true } }, _count: { select: { pagamentos: true } } } }),
      prisma.licenca.count({ where }),
    ])
    const comStatus = licencas.map((l) => ({ ...l, statusCalculado: calcularStatusLicenca(l.expiraEm, l.status), diasRestantes: diasParaExpirar(l.expiraEm) }))
    const filtradas = query.status ? comStatus.filter((l) => l.statusCalculado === query.status) : comStatus
    return paginar(filtradas, total, pagination)
  },

  async buscarPorId(id: string) {
    const l = await prisma.licenca.findUnique({ where: { id }, include: { empresa: { select: { id: true, nome: true } }, pagamentos: { orderBy: { criadoEm: 'desc' }, take: 5 } } })
    if (!l) throw new NotFoundError('Licença não encontrada')
    return { ...l, statusCalculado: calcularStatusLicenca(l.expiraEm, l.status), diasRestantes: diasParaExpirar(l.expiraEm) }
  },

  async buscarAtivaPorEmpresa(empresaId: string) {
    const l = await prisma.licenca.findFirst({ where: { empresaId, NOT: { status: StatusLicenca.Suspensa } }, orderBy: { expiraEm: 'desc' } })
    if (!l) return null
    const statusCalculado = calcularStatusLicenca(l.expiraEm, l.status)
    return statusCalculado === StatusLicenca.Ativa ? { ...l, statusCalculado } : null
  },

  async criar(data: z.infer<typeof criarLicencaSchema>) {
    if (!await prisma.empresa.findUnique({ where: { id: data.empresaId } })) throw new NotFoundError('Empresa não encontrada')
    if (data.inicioEm >= data.expiraEm) throw new ConflictError('Data de início deve ser anterior à expiração')
    return prisma.licenca.create({ data, include: { empresa: { select: { id: true, nome: true } } } })
  },

  async atualizar(id: string, data: z.infer<typeof atualizarLicencaSchema>) {
    await LicencaService.buscarPorId(id)
    return prisma.licenca.update({ where: { id }, data })
  },

  async verificarLimiteFuncionarios(empresaId: string) {
    const licenca = await LicencaService.buscarAtivaPorEmpresa(empresaId)
    if (!licenca) throw new LicencaInvalidaError()
    const total = await prisma.funcionario.count({ where: { empresaId, status: { not: 'Inativo' } } })
    if (total >= licenca.maxDeFuncionarios) throw new ConflictError(`Limite de ${licenca.maxDeFuncionarios} funcionários atingido para o plano ${licenca.plano}`)
  },
}

// =============================================================
// src/modules/licenca/licenca.controller.ts + routes
// =============================================================
import { Request, Response, NextFunction } from 'express'
import { success, created } from '@/shared/utils/index'

export async function listarLicencas(req: Request, res: Response, next: NextFunction) {
  try { return success(res, await LicencaService.listar(req.query)) } catch (e) { next(e) }
}
export async function buscarLicenca(req: Request, res: Response, next: NextFunction) {
  try { return success(res, await LicencaService.buscarPorId(req.params.id)) } catch (e) { next(e) }
}
export async function criarLicenca(req: Request, res: Response, next: NextFunction) {
  try { return created(res, await LicencaService.criar(req.body)) } catch (e) { next(e) }
}
export async function atualizarLicenca(req: Request, res: Response, next: NextFunction) {
  try { return success(res, await LicencaService.atualizar(req.params.id, req.body)) } catch (e) { next(e) }
}

import { Router } from 'express'
import { autenticar, autorizar, validar } from '@/shared/middlewares/index'
import { Papel } from '@/shared/types/enums'
import { criarLicencaSchema, atualizarLicencaSchema } from './licenca.service'

export const licencaRoutes = Router()
licencaRoutes.get(  '/licencas',     autenticar, autorizar(Papel.ADM, Papel.Operacional),                              listarLicencas)
licencaRoutes.post( '/licencas',     autenticar, autorizar(Papel.ADM, Papel.Operacional), validar(criarLicencaSchema), criarLicenca)
licencaRoutes.get(  '/licencas/:id', autenticar,                                                                       buscarLicenca)
licencaRoutes.patch('/licencas/:id', autenticar, autorizar(Papel.ADM, Papel.Operacional), validar(atualizarLicencaSchema), atualizarLicenca)

// =============================================================
// src/modules/pagamento/pagamento.service.ts + controller + routes
// =============================================================
import { StatusPagamento } from '@prisma/client'

export const criarPagamentoSchema = z.object({
  empresaId:   z.string().uuid(),
  licencaId:   z.string().uuid(),
  valor:       z.number().positive(),
  moeda:       z.string().default('AOA'),
  referencia:  z.string().optional(),
})
export const atualizarPagamentoSchema = z.object({
  status:     z.enum(['Pendente', 'Concluido', 'Reembolsado']),
  referencia: z.string().optional(),
})

export const PagamentoService = {
  async listar(query: Record<string, unknown>) {
    const pagination = parsePagination(query)
    const where: Prisma.PagamentoWhereInput = {
      ...(query.empresaId && { empresaId: query.empresaId as string }),
      ...(query.licencaId && { licencaId: query.licencaId as string }),
      ...(query.status    && { status:    query.status as StatusPagamento }),
    }
    const [pagamentos, total] = await prisma.$transaction([
      prisma.pagamento.findMany({ where, skip: pagination.skip, take: pagination.take, orderBy: { criadoEm: 'desc' }, include: { empresa: { select: { id: true, nome: true } }, licenca: { select: { id: true, plano: true } } } }),
      prisma.pagamento.count({ where }),
    ])
    return paginar(pagamentos, total, pagination)
  },

  async buscarPorId(id: string) {
    const p = await prisma.pagamento.findUnique({ where: { id }, include: { empresa: { select: { id: true, nome: true } }, licenca: true } })
    if (!p) throw new NotFoundError('Pagamento não encontrado')
    return p
  },

  async criar(data: z.infer<typeof criarPagamentoSchema>) {
    const licenca = await prisma.licenca.findUnique({ where: { id: data.licencaId } })
    if (!licenca) throw new NotFoundError('Licença não encontrada')
    if (licenca.empresaId !== data.empresaId) throw new ConflictError('Licença não pertence a esta empresa')
    return prisma.pagamento.create({ data, include: { empresa: { select: { id: true, nome: true } }, licenca: { select: { id: true, plano: true } } } })
  },

  async atualizar(id: string, data: z.infer<typeof atualizarPagamentoSchema>) {
    const pagamento = await PagamentoService.buscarPorId(id)
    const atualizado = await prisma.pagamento.update({ where: { id }, data })
    if (data.status === StatusPagamento.Concluido) {
      const licenca = await prisma.licenca.findUnique({ where: { id: pagamento.licencaId } })
      if (licenca) {
        const statusAtual = calcularStatusLicenca(licenca.expiraEm, licenca.status)
        const novaExpiracao = statusAtual === StatusLicenca.Ativa
          ? new Date(licenca.expiraEm.getTime() + 30 * 24 * 60 * 60 * 1000)
          : new Date(Date.now()                 + 365 * 24 * 60 * 60 * 1000)
        await prisma.licenca.update({ where: { id: licenca.id }, data: { status: StatusLicenca.Ativa, expiraEm: novaExpiracao } })
      }
    }
    return atualizado
  },
}

export async function listarPagamentos(req: Request, res: Response, next: NextFunction) {
  try { return success(res, await PagamentoService.listar(req.query)) } catch (e) { next(e) }
}
export async function buscarPagamento(req: Request, res: Response, next: NextFunction) {
  try { return success(res, await PagamentoService.buscarPorId(req.params.id)) } catch (e) { next(e) }
}
export async function criarPagamento(req: Request, res: Response, next: NextFunction) {
  try { return created(res, await PagamentoService.criar(req.body)) } catch (e) { next(e) }
}
export async function atualizarPagamento(req: Request, res: Response, next: NextFunction) {
  try { return success(res, await PagamentoService.atualizar(req.params.id, req.body)) } catch (e) { next(e) }
}

export const pagamentoRoutes = Router()
pagamentoRoutes.get(  '/pagamentos',     autenticar, autorizar(Papel.ADM, Papel.Operacional),                              listarPagamentos)
pagamentoRoutes.post( '/pagamentos',     autenticar,                                           validar(criarPagamentoSchema), criarPagamento)
pagamentoRoutes.get(  '/pagamentos/:id', autenticar,                                                                         buscarPagamento)
pagamentoRoutes.patch('/pagamentos/:id', autenticar, autorizar(Papel.ADM, Papel.Operacional),  validar(atualizarPagamentoSchema), atualizarPagamento)

// =============================================================
// src/modules/log/log.service.ts + controller + routes
// =============================================================
export const LogService = {
  async listar(query: Record<string, unknown>) {
    const pagination = parsePagination(query)
    const where: Prisma.LogWhereInput = {
      ...(query.usuarioId  && { usuarioId:    query.usuarioId as string }),
      ...(query.empresaId  && { empresaId:    query.empresaId as string }),
      ...(query.papel      && { nivelUsuario: query.papel as any }),
      ...(query.acao       && { acao: { contains: query.acao as string, mode: 'insensitive' } }),
      ...(query.statusHttp && { statusHttp: parseInt(String(query.statusHttp)) }),
      ...((query.dataInicio || query.dataFim) && { criadoEm: {
        ...(query.dataInicio && { gte: new Date(query.dataInicio as string) }),
        ...(query.dataFim    && { lte: new Date(query.dataFim    as string) }),
      }}),
    }
    const [logs, total] = await prisma.$transaction([
      prisma.log.findMany({ where, skip: pagination.skip, take: pagination.take, orderBy: { criadoEm: 'desc' }, include: { usuario: { select: { id: true, nome: true, email: true, papel: true } }, empresa: { select: { id: true, nome: true } } } }),
      prisma.log.count({ where }),
    ])
    return paginar(logs, total, pagination)
  },
}

export async function listarLogs(req: Request, res: Response, next: NextFunction) {
  try { return success(res, await LogService.listar(req.query)) } catch (e) { next(e) }
}

export const logRoutes = Router()
logRoutes.get('/logs', autenticar, autorizar(Papel.ADM), listarLogs)

// =============================================================
// src/modules/relatorio/relatorio.service.ts + controller + routes
// =============================================================
export const RelatorioService = {
  async alertas(filtro: { empresaId?: string; dataInicio?: Date; dataFim?: Date }) {
    const where: Prisma.AlertaWhereInput = {
      ...(filtro.empresaId && { empresaId: filtro.empresaId }),
      ...((filtro.dataInicio || filtro.dataFim) && { criadoEm: { ...(filtro.dataInicio && { gte: filtro.dataInicio }), ...(filtro.dataFim && { lte: filtro.dataFim }) } }),
    }
    const [total, naoLidos, porNivel, porEquipamento] = await prisma.$transaction([
      prisma.alerta.count({ where }),
      prisma.alerta.count({ where: { ...where, lidoEm: null } }),
      prisma.alerta.groupBy({ by: ['nivel'], where, _count: { nivel: true }, orderBy: { _count: { nivel: 'desc' } } }),
      prisma.alerta.groupBy({ by: ['equipamentoId'], where, _count: { equipamentoId: true }, orderBy: { _count: { equipamentoId: 'desc' } }, take: 10 }),
    ])
    const equipamentos = await prisma.equipamento.findMany({ where: { id: { in: porEquipamento.map((e) => e.equipamentoId) } }, select: { id: true, nome: true, localizacao: true } })
    const eqMap = Object.fromEntries(equipamentos.map((e) => [e.id, e]))
    return { total, naoLidos, taxaLeitura: total > 0 ? Math.round(((total - naoLidos) / total) * 100) : 0, porNivel: porNivel.map((p) => ({ nivel: p.nivel, total: p._count.nivel })), topEquipamentos: porEquipamento.map((p) => ({ equipamento: eqMap[p.equipamentoId], totalAlertas: p._count.equipamentoId })) }
  },

  async financeiro(filtro: { empresaId?: string; dataInicio?: Date; dataFim?: Date }) {
    const where: Prisma.PagamentoWhereInput = {
      ...(filtro.empresaId && { empresaId: filtro.empresaId }),
      ...((filtro.dataInicio || filtro.dataFim) && { criadoEm: { ...(filtro.dataInicio && { gte: filtro.dataInicio }), ...(filtro.dataFim && { lte: filtro.dataFim }) } }),
    }
    const [totaisStatus, receitaTotal] = await prisma.$transaction([
      prisma.pagamento.groupBy({ by: ['status'], where, _count: { status: true }, _sum: { valor: true } }),
      prisma.pagamento.aggregate({ where: { ...where, status: 'Concluido' }, _sum: { valor: true } }),
    ])
    return { receitaTotal: receitaTotal._sum.valor ?? 0, porStatus: totaisStatus.map((p) => ({ status: p.status, total: p._count.status, valor: p._sum.valor ?? 0 })) }
  },

  async licencas(filtro: { empresaId?: string }) {
    const where: Prisma.LicencaWhereInput = { ...(filtro.empresaId && { empresaId: filtro.empresaId }) }
    const [todas, porPlano] = await prisma.$transaction([
      prisma.licenca.findMany({ where, include: { empresa: { select: { id: true, nome: true } } } }),
      prisma.licenca.groupBy({ by: ['plano'], where, _count: { plano: true } }),
    ])
    const comStatus = todas.map((l) => ({ ...l, statusCalculado: calcularStatusLicenca(l.expiraEm, l.status), diasRestantes: diasParaExpirar(l.expiraEm) }))
    return { total: todas.length, porStatus: { ativas: comStatus.filter((l) => l.statusCalculado === 'Ativa').length, expiradas: comStatus.filter((l) => l.statusCalculado === 'Expirada').length, suspensas: comStatus.filter((l) => l.statusCalculado === 'Suspensa').length }, porPlano: porPlano.map((p) => ({ plano: p.plano, total: p._count.plano })), aExpirarEm30Dias: comStatus.filter((l) => l.statusCalculado === 'Ativa' && l.diasRestantes <= 30) }
  },
}

function parseFiltro(query: Record<string, unknown>) {
  return {
    empresaId:  query.empresaId as string | undefined,
    dataInicio: query.dataInicio ? new Date(query.dataInicio as string) : undefined,
    dataFim:    query.dataFim    ? new Date(query.dataFim    as string) : undefined,
  }
}

export async function relatorioAlertas(req: Request, res: Response, next: NextFunction) {
  try { return success(res, await RelatorioService.alertas(parseFiltro(req.query))) } catch (e) { next(e) }
}
export async function relatorioFinanceiro(req: Request, res: Response, next: NextFunction) {
  try { return success(res, await RelatorioService.financeiro(parseFiltro(req.query))) } catch (e) { next(e) }
}
export async function relatorioLicencas(req: Request, res: Response, next: NextFunction) {
  try { return success(res, await RelatorioService.licencas(parseFiltro(req.query))) } catch (e) { next(e) }
}

export const relatorioRoutes = Router()
relatorioRoutes.get('/relatorios/alertas',     autenticar, escopoEmpresa, relatorioAlertas)
relatorioRoutes.get('/relatorios/financeiro',  autenticar, autorizar(Papel.ADM, Papel.Operacional), relatorioFinanceiro)
relatorioRoutes.get('/relatorios/licencas',    autenticar, autorizar(Papel.ADM, Papel.Operacional), relatorioLicencas)
