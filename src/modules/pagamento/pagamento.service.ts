import { StatusPagamento, StatusLicenca, Prisma } from '@prisma/client'
import { prisma }                         from '@/shared/database/prisma.client'
import { NotFoundError, ConflictError }   from '@/shared/errors/AppError'
import { parsePagination, paginar } from '@/shared/utils/page'
import { calcularStatusLicenca } from "@/shared/utils/licencaStatus";
import { atualizarPagamentoSchema, criarPagamentoSchema } from './pagamento.schema'
import z from 'zod'

export const PagamentoService = {

  async listar(query: Record<string, unknown>) {
    const pagination = parsePagination(query)

    const where: Prisma.PagamentoWhereInput = {
      ...(query.empresaId && { empresaId: query.empresaId as string }),
      ...(query.licencaId && { licencaId: query.licencaId as string }),
      ...(query.status    && { status:    query.status    as StatusPagamento }),
    }

    const [pagamentos, total] = await prisma.$transaction([
      prisma.pagamento.findMany({
        where,
        skip:    pagination.skip,
        take:    pagination.take,
        orderBy: { criadoEm: 'desc' },
        include: {
          empresa: { select: { id: true, nome: true } },
          licenca: { select: { id: true, plano: true } },
        },
      }),
      prisma.pagamento.count({ where }),
    ])

    return paginar(pagamentos, total, pagination)
  },

  async buscarPorId(id: string) {
    const pagamento = await prisma.pagamento.findUnique({
      where:   { id },
      include: {
        empresa: { select: { id: true, nome: true } },
        licenca: true,
      },
    })

    if (!pagamento) throw new NotFoundError('Pagamento não encontrado')
    return pagamento
  },

  async criar(data: z.infer<typeof criarPagamentoSchema>) {
    const licenca = await prisma.licenca.findUnique({ where: { id: data.licencaId } })
    if (!licenca) throw new NotFoundError('Licença não encontrada')
    if (licenca.empresaId !== data.empresaId) {
      throw new ConflictError('Licença não pertence a esta empresa')
    }

    return prisma.pagamento.create({
      data: { ...data, moeda: data.moeda ?? 'AOA' },
      include: {
        empresa: { select: { id: true, nome: true } },
        licenca: { select: { id: true, plano: true } },
      },
    })
  },

  async atualizar(id: string, data: z.infer<typeof atualizarPagamentoSchema>) {
    const pagamento = await PagamentoService.buscarPorId(id)

    const atualizado = await prisma.pagamento.update({ where: { id }, data })

    // Ao concluir pagamento, activa ou renova a licença vinculada
    if (data.status === StatusPagamento.Concluido) {
      const licenca = await prisma.licenca.findUnique({ where: { id: pagamento.licencaId } })
      if (licenca) {
        const statusAtual = calcularStatusLicenca(licenca.expiraEm, licenca.status)

        const novaExpiracao = statusAtual === StatusLicenca.Ativa
          ? new Date(licenca.expiraEm.getTime() + 30  * 24 * 60 * 60 * 1000) // +30 dias
          : new Date(Date.now()                 + 365 * 24 * 60 * 60 * 1000) // +365 dias

        await prisma.licenca.update({
          where: { id: licenca.id },
          data:  { status: StatusLicenca.Ativa, expiraEm: novaExpiracao },
        })
      }
    }

    return atualizado
  },
}
