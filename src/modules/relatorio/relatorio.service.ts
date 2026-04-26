import { Prisma } from '@prisma/client'
import { prisma } from '@/shared/database/prisma.client'
import { calcularStatusLicenca, diasParaExpirar } from '@/shared/utils/licencaStatus'

interface FiltroRelatorio {
  empresaId?:  string
  dataInicio?: Date
  dataFim?:    Date
}

export const RelatorioService = {

  // Alertas: total, por nível, taxa de leitura, top equipamentos
  async alertas(filtro: FiltroRelatorio) {
    const where: Prisma.AlertaWhereInput = {
      ...(filtro.empresaId && { empresaId: filtro.empresaId }),
      ...((filtro.dataInicio || filtro.dataFim) && {
        criadoEm: {
          ...(filtro.dataInicio && { gte: filtro.dataInicio }),
          ...(filtro.dataFim    && { lte: filtro.dataFim    }),
        },
      }),
    }

    const [total, naoLidos, porNivel, porEquipamento] = await prisma.$transaction([
      prisma.alerta.count({ where }),
      prisma.alerta.count({ where: { ...where, lidoEm: null } }),
      prisma.alerta.groupBy({
        by:      ['nivel'],
        where,
        _count:  { nivel: true },
        orderBy: { _count: { nivel: 'desc' } },
      }),
      prisma.alerta.groupBy({
        by:      ['equipamentoId'],
        where,
        _count:  { equipamentoId: true },
        orderBy: { _count: { equipamentoId: 'desc' } },
        take:    10,
      }),
    ])

    const equipamentos = await prisma.equipamento.findMany({
      where:  { id: { in: porEquipamento.map((e) => e.equipamentoId) } },
      select: { id: true, nome: true, localizacao: true },
    })
    const eqMap = Object.fromEntries(equipamentos.map((e) => [e.id, e]))

    return {
      total,
      naoLidos,
      taxaLeitura: total > 0 ? Math.round(((total - naoLidos) / total) * 100) : 0,
      porNivel:    porNivel.map((p) => ({ nivel: p.nivel, total: p._count.nivel })),
      topEquipamentos: porEquipamento.map((p) => ({
        equipamento:  eqMap[p.equipamentoId],
        totalAlertas: p._count.equipamentoId,
      })),
    }
  },

  // Financeiro: receita total, por status, top empresas pagadoras
  async financeiro(filtro: FiltroRelatorio) {
    const where: Prisma.PagamentoWhereInput = {
      ...(filtro.empresaId && { empresaId: filtro.empresaId }),
      ...((filtro.dataInicio || filtro.dataFim) && {
        criadoEm: {
          ...(filtro.dataInicio && { gte: filtro.dataInicio }),
          ...(filtro.dataFim    && { lte: filtro.dataFim    }),
        },
      }),
    }

    const [totaisStatus, receitaTotal, porEmpresa] = await prisma.$transaction([
      prisma.pagamento.groupBy({
        by:    ['status'],
        where,
        _count: { status: true },
        _sum:   { valor: true },
      }),
      prisma.pagamento.aggregate({
        where: { ...where, status: 'Concluido' },
        _sum:  { valor: true },
      }),
      prisma.pagamento.groupBy({
        by:      ['empresaId'],
        where:   { ...where, status: 'Concluido' },
        _sum:    { valor: true },
        orderBy: { _sum: { valor: 'desc' } },
        take:    10,
      }),
    ])

    const empresas = await prisma.empresa.findMany({
      where:  { id: { in: porEmpresa.map((p) => p.empresaId) } },
      select: { id: true, nome: true },
    })
    const empresasMap = Object.fromEntries(empresas.map((e) => [e.id, e]))

    return {
      receitaTotal: receitaTotal._sum.valor ?? 0,
      porStatus: totaisStatus.map((p) => ({
        status: p.status,
        total:  p._count.status,
        valor:  p._sum.valor ?? 0,
      })),
      topEmpresas: porEmpresa.map((p) => ({
        empresa:   empresasMap[p.empresaId],
        valorPago: p._sum.valor ?? 0,
      })),
    }
  },

  // Licenças: por status calculado, por plano, a expirar em 30 dias
  async licencas(filtro: FiltroRelatorio) {
    const where: Prisma.LicencaWhereInput = {
      ...(filtro.empresaId && { empresaId: filtro.empresaId }),
    }

    const [todas, porPlano] = await prisma.$transaction([
      prisma.licenca.findMany({
        where,
        include: { empresa: { select: { id: true, nome: true } } },
      }),
      prisma.licenca.groupBy({
        by:    ['plano'],
        where,
        _count: { plano: true },
      }),
    ])

    const comStatus = todas.map((l) => ({
      ...l,
      statusCalculado: calcularStatusLicenca(l.expiraEm, l.status),
      diasRestantes:   diasParaExpirar(l.expiraEm),
    }))

    return {
      total: todas.length,
      porStatus: {
        ativas:    comStatus.filter((l) => l.statusCalculado === 'Ativa').length,
        expiradas: comStatus.filter((l) => l.statusCalculado === 'Expirada').length,
        suspensas: comStatus.filter((l) => l.statusCalculado === 'Suspensa').length,
      },
      porPlano: porPlano.map((p) => ({ plano: p.plano, total: p._count.plano })),
      aExpirarEm30Dias: comStatus.filter(
        (l) => l.statusCalculado === 'Ativa' && l.diasRestantes <= 30
      ),
    }
  },

  // Equipamentos: total, por status, com mais alertas
  async equipamentos(filtro: FiltroRelatorio) {
    const where: Prisma.EquipamentoWhereInput = {
      ...(filtro.empresaId && { empresaId: filtro.empresaId }),
    }

    const [total, porStatus, comMaisAlertas] = await prisma.$transaction([
      prisma.equipamento.count({ where }),
      prisma.equipamento.groupBy({
        by:    ['status'],
        where,
        _count: { status: true },
      }),
      prisma.equipamento.findMany({
        where,
        orderBy: { alertas: { _count: 'desc' } },
        take:    10,
        include: {
          _count:  { select: { alertas: true } },
          empresa: { select: { id: true, nome: true } },
        },
      }),
    ])

    return {
      total,
      porStatus:      porStatus.map((p) => ({ status: p.status, total: p._count.status })),
      comMaisAlertas,
    }
  },
}
