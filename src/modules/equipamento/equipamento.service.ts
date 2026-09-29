import { StatusEquipamento, NivelAlerta, Prisma } from '@prisma/client'
import { prisma }           from '@/shared/database/prisma.client'
import { NotFoundError, ConflictError } from '@/shared/errors/AppError'
import { parsePagination, paginar }     from '@/shared/utils/page'

export const EquipamentoService = {

  // funcionarioId: só definido quando quem pede é um Tecnico — restringe
  // aos equipamentos destacados a esse Funcionario (ver auth.middleware /
  // req.user.funcionarioId). Undefined para os outros papéis = vê tudo
  // (já filtrado por empresaId nesses casos).
  async listar(query: Record<string, unknown>, funcionarioId?: string) {
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
      ...(funcionarioId && { funcionariosDestacados: { some: { funcionarioId } } }),
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

  async resumo(empresaId?: string, funcionarioId?: string) {
    const where: Prisma.EquipamentoWhereInput = {
      ...(empresaId && { empresaId }),
      ...(funcionarioId && { funcionariosDestacados: { some: { funcionarioId } } }),
    }

    const [total, operacional, manutencao, comAlertasPorResolver] = await prisma.$transaction([
      prisma.equipamento.count({ where }),
      prisma.equipamento.count({ where: { ...where, status: StatusEquipamento.Operacional } }),
      prisma.equipamento.count({ where: { ...where, status: StatusEquipamento.Manutencao } }),
      prisma.equipamento.count({ where: { ...where, alertas: { some: { lidoEm: null } } } }),
    ])

    return { total, operacional, manutencao, comAlertasPorResolver }
  },

  async buscarPorId(id: string, empresaId?: string, funcionarioId?: string) {
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
    if (funcionarioId) {
      const destaque = await prisma.equipamentoDestacado.findUnique({
        where: { funcionarioId_equipamentoId: { funcionarioId, equipamentoId: id } },
      })
      if (!destaque) throw new NotFoundError('Equipamento não encontrado')
    }

    return equipamento
  },

  // ── Destaque de equipamentos a Funcionarios (Técnicos) ────────────────

  async destacarFuncionario(equipamentoId: string, funcionarioId: string, destacadoPorId: string, empresaId?: string) {
    const equipamento = await EquipamentoService.buscarPorId(equipamentoId, empresaId)

    const funcionario = await prisma.funcionario.findUnique({ where: { id: funcionarioId } })
    if (!funcionario) throw new NotFoundError('Funcionário não encontrado')
    if (funcionario.empresaId !== equipamento.empresaId) {
      throw new ConflictError('O funcionário não pertence à mesma empresa do equipamento')
    }

    const existente = await prisma.equipamentoDestacado.findUnique({
      where: { funcionarioId_equipamentoId: { funcionarioId, equipamentoId } },
    })
    if (existente) throw new ConflictError('Este equipamento já está destacado a este funcionário')

    return prisma.equipamentoDestacado.create({
      data: { equipamentoId, funcionarioId, destacadoPorId },
      include: { funcionario: { select: { id: true, nome: true, cargo: true } } },
    })
  },

  async removerDestaque(equipamentoId: string, funcionarioId: string, empresaId?: string) {
    await EquipamentoService.buscarPorId(equipamentoId, empresaId)

    const destaque = await prisma.equipamentoDestacado.findUnique({
      where: { funcionarioId_equipamentoId: { funcionarioId, equipamentoId } },
    })
    if (!destaque) throw new NotFoundError('Este equipamento não está destacado a este funcionário')

    await prisma.equipamentoDestacado.delete({ where: { id: destaque.id } })
  },

  async listarDestacados(equipamentoId: string, empresaId?: string) {
    await EquipamentoService.buscarPorId(equipamentoId, empresaId)
    return prisma.equipamentoDestacado.findMany({
      where:   { equipamentoId },
      include: { funcionario: { select: { id: true, nome: true, cargo: true, status: true } } },
      orderBy: { criadoEm: 'desc' },
    })
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
