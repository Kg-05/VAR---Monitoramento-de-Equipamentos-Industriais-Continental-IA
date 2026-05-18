// src/modules/licenca/licenca.service.ts
import { PlanoLicenca, StatusLicenca } from '@prisma/client'
import { prisma }           from '@/shared/database/prisma.client'
import { NotFoundError, ConflictError, LicencaInvalidaError } from '@/shared/errors/AppError'
import { calcularStatusLicenca, diasParaExpirar } from '@/shared/utils/licencaStatus'
import { parsePagination, paginar } from '@/shared/utils/page'
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

  async listar(query: Record<string, any>) {
    const pagination = parsePagination(query)
    const where: any = {}
    if (query.empresaId) where.empresaId = query.empresaId
    if (query.plano)     where.plano     = query.plano

    const [licencas, total] = await prisma.$transaction([
      prisma.licenca.findMany({
        where,
        skip:    pagination.skip,
        take:    pagination.take,
        orderBy: { criadoEm: 'desc' },
        include: {
          empresa: { select: { id: true, nome: true } },
          _count:  { select: { pagamentos: true } },
        },
      }),
      prisma.licenca.count({ where }),
    ])

    const comStatus = licencas.map((l) => ({
      ...l,
      statusCalculado: calcularStatusLicenca(l.expiraEm, l.status),
      diasRestantes:   diasParaExpirar(l.expiraEm),
    }))

    const filtradas = query.status
      ? comStatus.filter((l) => l.statusCalculado === query.status)
      : comStatus

    return paginar(filtradas, total, pagination)
  },

  async buscarPorId(id: string) {
    const l = await prisma.licenca.findUnique({
      where:   { id },
      include: {
        empresa:    { select: { id: true, nome: true } },
        pagamentos: { orderBy: { criadoEm: 'desc' }, take: 5 },
      },
    })
    if (!l) throw new NotFoundError('Licença não encontrada')
    return {
      ...l,
      statusCalculado: calcularStatusLicenca(l.expiraEm, l.status),
      diasRestantes:   diasParaExpirar(l.expiraEm),
    }
  },

  async buscarAtivaPorEmpresa(empresaId: string) {
    const l = await prisma.licenca.findFirst({
      where:   { empresaId, NOT: { status: StatusLicenca.Suspensa } },
      orderBy: { expiraEm: 'desc' },
    })
    if (!l) return null
    const statusCalculado = calcularStatusLicenca(l.expiraEm, l.status)
    return statusCalculado === StatusLicenca.Ativa ? { ...l, statusCalculado } : null
  },

  async criar(data: z.infer<typeof criarLicencaSchema>) {
    if (!await prisma.empresa.findUnique({ where: { id: data.empresaId } })) {
      throw new NotFoundError('Empresa não encontrada')
    }
    if (data.inicioEm >= data.expiraEm) {
      throw new ConflictError('Data de início deve ser anterior à expiração')
    }
    // "as any" necessário porque o Prisma 5 tem conflito de tipos entre
    // LicencaCreateInput e LicencaUncheckedCreateInput com empresaId directo
    return (prisma.licenca.create as any)({
      data,
      include: { empresa: { select: { id: true, nome: true } } },
    })
  },

  async atualizar(id: string, data: z.infer<typeof atualizarLicencaSchema>) {
    await LicencaService.buscarPorId(id)
    return (prisma.licenca.update as any)({ where: { id }, data })
  },

  async verificarLimiteFuncionarios(empresaId: string) {
    const licenca = await LicencaService.buscarAtivaPorEmpresa(empresaId)
    if (!licenca) throw new LicencaInvalidaError()
    const total = await prisma.funcionario.count({
      where: { empresaId, status: { not: 'Inativo' as any } },
    })
    if (total >= licenca.maxDeFuncionarios) {
      throw new ConflictError(
        `Limite de ${licenca.maxDeFuncionarios} funcionários atingido para o plano ${licenca.plano}`
      )
    }
  },
}