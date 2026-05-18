// src/modules/pagamento/pagamento.service.ts
import { StatusPagamento, StatusLicenca } from '@prisma/client'
import { prisma }                       from '@/shared/database/prisma.client'
import { NotFoundError, ConflictError } from '@/shared/errors/AppError'
import { parsePagination, paginar } from '@/shared/utils/page'
import { calcularStatusLicenca } from '@/shared/utils/licencaStatus'
import { z } from 'zod'

export const criarPagamentoSchema = z.object({
  empresaId:  z.string().uuid(),
  licencaId:  z.string().uuid(),
  valor:      z.number().positive(),
  moeda:      z.string().default('AOA'),
  referencia: z.string().optional(),
})

export const atualizarPagamentoSchema = z.object({
  status:     z.enum(['Pendente', 'Concluido', 'Reembolsado']),
  referencia: z.string().optional(),
})

export const PagamentoService = {

  async listar(query: Record<string, any>) {
    const pagination = parsePagination(query)
    const where: any = {}
    if (query.empresaId) where.empresaId = query.empresaId
    if (query.licencaId) where.licencaId = query.licencaId
    if (query.status)    where.status    = query.status

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
    const p = await prisma.pagamento.findUnique({
      where:   { id },
      include: {
        empresa: { select: { id: true, nome: true } },
        licenca: true,
      },
    })
    if (!p) throw new NotFoundError('Pagamento não encontrado')
    return p
  },

  async criar(data: z.infer<typeof criarPagamentoSchema>) {
    const licenca = await prisma.licenca.findUnique({ where: { id: data.licencaId } })
    if (!licenca) throw new NotFoundError('Licença não encontrada')
    if (licenca.empresaId !== data.empresaId) {
      throw new ConflictError('Licença não pertence a esta empresa')
    }
    // "as any" necessário pelo mesmo conflito de tipos do Prisma 5
    return (prisma.pagamento.create as any)({
      data: { ...data, moeda: data.moeda ?? 'AOA' },
      include: {
        empresa: { select: { id: true, nome: true } },
        licenca: { select: { id: true, plano: true } },
      },
    })
  },

  async atualizar(id: string, data: z.infer<typeof atualizarPagamentoSchema>) {
    const pagamento = await PagamentoService.buscarPorId(id)
    const atualizado = await prisma.pagamento.update({ where: { id }, data: data as any })

    // Ao concluir, activa ou renova a licença
    if (data.status === StatusPagamento.Concluido) {
      const licenca = await prisma.licenca.findUnique({ where: { id: pagamento.licencaId } })
      if (licenca) {
        const statusAtual    = calcularStatusLicenca(licenca.expiraEm, licenca.status)
        const novaExpiracao  = statusAtual === StatusLicenca.Ativa
          ? new Date(licenca.expiraEm.getTime() + 30  * 24 * 60 * 60 * 1000)
          : new Date(Date.now()                 + 365 * 24 * 60 * 60 * 1000)
        await prisma.licenca.update({
          where: { id: licenca.id },
          data:  { status: StatusLicenca.Ativa, expiraEm: novaExpiracao },
        })
      }
    }
    return atualizado
  },
}