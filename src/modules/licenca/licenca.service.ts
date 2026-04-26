import { PlanoLicenca, StatusLicenca, Prisma } from '@prisma/client'
import { prisma }           from '@/shared/database/prisma.client'
import { NotFoundError, ConflictError, LicencaInvalidaError } from '@/shared/errors/AppError'
import { calcularStatusLicenca, diasParaExpirar} from '@/shared/utils/licencaStatus'
import { parsePagination, paginar } from '@/shared/utils/page';
import { criarLicencaSchema, atualizarLicencaSchema } from './licenca.schema'
import z from 'zod'

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

export { criarLicencaSchema, atualizarLicencaSchema }
