import { StatusEquipamento, NivelAlerta, Prisma } from '@prisma/client'
import { prisma }           from '@/shared/database/prisma.client'
import { NotFoundError, ConflictError } from '@/shared/errors/AppError'
import { parsePagination, paginar }     from '@/shared/utils/page'

export const EquipamentoService = {

  async listar(query: Record<string, unknown>) {
    const pagination = parsePagination(query)

    const where: Prisma.EquipamentoWhereInput = {
      ...(query.empresaId && { empresaId: query.empresaId as string }),
      ...(query.status    && { status:    query.status as StatusEquipamento }),
      ...(query.search    && {
        OR: [
          { nome:        { contains: query.search as string, mode: 'insensitive' } },
          { modelo:      { contains: query.search as string, mode: 'insensitive' } },
          { fabricante:  { contains: query.search as string, mode: 'insensitive' } },
          { localizacao: { contains: query.search as string, mode: 'insensitive' } },
        ],
      }),
    }

    const [equipamentos, total] = await prisma.$transaction([
      prisma.equipamento.findMany({
        where,
        skip:    pagination.skip,
        take:    pagination.take,
        orderBy: { criadoEm: 'desc' },
        include: {
          empresa: { select: { id: true, nome: true } },
          _count:  { select: { alertas: true } },
        },
      }),
      prisma.equipamento.count({ where }),
    ])

    return paginar(equipamentos, total, pagination)
  },

  async buscarPorId(id: string, empresaId?: string) {
    const equipamento = await prisma.equipamento.findUnique({
      where:   { id },
      include: {
        empresa: { select: { id: true, nome: true } },
        alertas: {
          orderBy: { criadoEm: 'desc' },
          take:    5,
          select:  { id: true, nivel: true, descricao: true, criadoEm: true, lidoEm: true },
        },
      },
    })

    if (!equipamento) throw new NotFoundError('Equipamento não encontrado')
    if (empresaId && equipamento.empresaId !== empresaId) {
      throw new NotFoundError('Equipamento não encontrado')
    }

    return equipamento
  },

  async criar(data: {
    empresaId:    string
    nome:         string
    modelo:       string
    fabricante?:  string
    numeroSerie?: string
    localizacao:  string
  }) {
    if (data.numeroSerie) {
      const existe = await prisma.equipamento.findFirst({
        where: { numeroSerie: data.numeroSerie, empresaId: data.empresaId },
      })
      if (existe) throw new ConflictError('Número de série já cadastrado nesta empresa')
    }

    return prisma.equipamento.create({
      data,
      include: { empresa: { select: { id: true, nome: true } } },
    })
  },

  async atualizar(
    id: string,
    data: Partial<{
      nome:        string
      modelo:      string
      fabricante:  string
      localizacao: string
      status:      StatusEquipamento
    }>,
    empresaId?: string,
  ) {
    const equipamento = await EquipamentoService.buscarPorId(id, empresaId)
    const anterior    = equipamento.status

    const atualizado = await prisma.equipamento.update({ where: { id }, data })

    // Dispara alerta automático ao entrar em manutenção
    if (
      data.status === StatusEquipamento.Manutencao &&
      anterior    === StatusEquipamento.Operacional
    ) {
      await prisma.alerta.create({
        data: {
          descricao:     `Equipamento "${equipamento.nome}" entrou em modo de manutenção`,
          nivel:         NivelAlerta.medio,
          empresaId:     equipamento.empresaId,
          equipamentoId: id,
        },
      })
    }

    return atualizado
  },

  async remover(id: string) {
    await EquipamentoService.buscarPorId(id)
    return prisma.equipamento.delete({ where: { id } })
  },
}
