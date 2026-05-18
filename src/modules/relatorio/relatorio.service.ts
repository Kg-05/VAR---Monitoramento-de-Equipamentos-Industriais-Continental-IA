// src/modules/relatorio/relatorio.service.ts
import { prisma } from '@/shared/database/prisma.client'
import { calcularStatusLicenca, diasParaExpirar } from '@/shared/utils/licencaStatus'

export interface FiltroRelatorio {
  empresaId?:  string
  dataInicio?: Date
  dataFim?:    Date
}

export const RelatorioService = {

  async alertas(filtro: FiltroRelatorio) {
    const where: any = {}
    if (filtro.empresaId) where.empresaId = filtro.empresaId
    if (filtro.dataInicio || filtro.dataFim) {
      where.criadoEm = {}
      if (filtro.dataInicio) where.criadoEm.gte = filtro.dataInicio
      if (filtro.dataFim)    where.criadoEm.lte = filtro.dataFim
    }

    const [total, naoLidos, porNivel, porEquipamento] = await prisma.$transaction([
      prisma.alerta.count({ where }),
      prisma.alerta.count({ where: { ...where, lidoEm: null } }),
      prisma.alerta.groupBy({
        by:      ['nivel'],
        where,
        _count:  true,
        orderBy: { _count: { nivel: 'desc' } },
      }) as any,
      prisma.alerta.groupBy({
        by:      ['equipamentoId'],
        where,
        _count:  true,
        orderBy: { _count: { equipamentoId: 'desc' } },
        take:    10,
      }) as any,
    ])

    const equipamentos = await prisma.equipamento.findMany({
      where:  { id: { in: (porEquipamento as any[]).map((e: any) => e.equipamentoId) } },
      select: { id: true, nome: true, localizacao: true },
    })
    const eqMap = Object.fromEntries(equipamentos.map((e) => [e.id, e]))

    return {
      total,
      naoLidos,
      taxaLeitura: total > 0 ? Math.round(((total - naoLidos) / total) * 100) : 0,
      porNivel:    (porNivel as any[]).map((p: any) => ({ nivel: p.nivel, total: p._count })),
      topEquipamentos: (porEquipamento as any[]).map((p: any) => ({
        equipamento:  eqMap[p.equipamentoId],
        totalAlertas: p._count,
      })),
    }
  },

  async financeiro(filtro: FiltroRelatorio) {
    const where: any = {}
    if (filtro.empresaId) where.empresaId = filtro.empresaId
    if (filtro.dataInicio || filtro.dataFim) {
      where.criadoEm = {}
      if (filtro.dataInicio) where.criadoEm.gte = filtro.dataInicio
      if (filtro.dataFim)    where.criadoEm.lte = filtro.dataFim
    }

    const [totaisStatus, receitaTotal, porEmpresa] = await prisma.$transaction([
      prisma.pagamento.groupBy({
        by:      ['status'],
        where,
        _count:  true,
        _sum:    { valor: true },
        orderBy: { _count: { status: 'desc' } },
      }) as any,
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
      }) as any,
    ])

    const empresas = await prisma.empresa.findMany({
      where:  { id: { in: (porEmpresa as any[]).map((p: any) => p.empresaId) } },
      select: { id: true, nome: true },
    })
    const empresasMap = Object.fromEntries(empresas.map((e) => [e.id, e]))

    return {
      receitaTotal: receitaTotal._sum.valor ?? 0,
      porStatus: (totaisStatus as any[]).map((p: any) => ({
        status: p.status,
        total:  p._count,
        valor:  p._sum?.valor ?? 0,
      })),
      topEmpresas: (porEmpresa as any[]).map((p: any) => ({
        empresa:   empresasMap[p.empresaId],
        valorPago: p._sum?.valor ?? 0,
      })),
    }
  },

  async licencas(filtro: FiltroRelatorio) {
    const where: any = {}
    if (filtro.empresaId) where.empresaId = filtro.empresaId

    const [todas, porPlano] = await prisma.$transaction([
      prisma.licenca.findMany({
        where,
        include: { empresa: { select: { id: true, nome: true } } },
      }),
      prisma.licenca.groupBy({
        by:      ['plano'],
        where,
        _count:  true,
        orderBy: { _count: { plano: 'desc' } },
      }) as any,
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
      porPlano: (porPlano as any[]).map((p: any) => ({ plano: p.plano, total: p._count })),
      aExpirarEm30Dias: comStatus.filter(
        (l) => l.statusCalculado === 'Ativa' && l.diasRestantes <= 30
      ),
    }
  },

  async equipamentos(filtro: FiltroRelatorio) {
    const where: any = {}
    if (filtro.empresaId) where.empresaId = filtro.empresaId

    const [total, porStatus, comMaisAlertas] = await prisma.$transaction([
      prisma.equipamento.count({ where }),
      prisma.equipamento.groupBy({
        by:      ['status'],
        where,
        _count:  true,
        orderBy: { _count: { status: 'desc' } },
      }) as any,
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
      porStatus:      (porStatus as any[]).map((p: any) => ({ status: p.status, total: p._count })),
      comMaisAlertas,
    }
  },
}