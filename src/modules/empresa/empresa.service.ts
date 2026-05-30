import { Prisma } from '@prisma/client'
import { prisma }           from '@/shared/database/prisma.client'
import { NotFoundError, ConflictError } from '@/shared/errors/AppError'
import { parsePagination, paginar }     from '@/shared/utils/page'

export interface CreateEmpresaDto { nome: string; cnpj: string; email: string; telefone?: string }
export interface UpdateEmpresaDto { nome?: string; email?: string; telefone?: string; status?: 'Ativo' | 'Inativo' }
export interface ListarEmpresasQuery {
  [key: string]: unknown;
  page?: unknown;
  limit?: unknown;
  search?: string;
  status?: string;
}

export const EmpresaService = {
  async listar(query: ListarEmpresasQuery) {
    const pagination = parsePagination(query)
    const where: Prisma.EmpresaWhereInput = {
      status: query.status ? (query.status as any) : 'Ativo',
      ...(query.search && { OR: [
        { nome:  { contains: query.search } },
        { cnpj:  { contains: query.search } },
        { email: { contains: query.search } },
      ]}),
    }
    const [empresas, total] = await prisma.$transaction([
      prisma.empresa.findMany({
        where, skip: pagination.skip, take: pagination.take,
        orderBy: { criadoEm: 'desc' },
        include: {
          _count:  { select: { funcionarios: true, equipamentos: true } },
          licencas: { orderBy: { expiraEm: 'desc' }, take: 1, select: { plano: true, status: true, expiraEm: true } },
        },
      }),
      prisma.empresa.count({ where }),
    ])
    return paginar(empresas, total, pagination)
  },

  async buscarPorId(id: string) {
    const empresa = await prisma.empresa.findUnique({
      where:   { id },
      include: { licencas: { orderBy: { criadoEm: 'desc' }, take: 1 }, _count: { select: { funcionarios: true, equipamentos: true, alertas: true } } },
    })
    if (!empresa) throw new NotFoundError('Empresa não encontrada')
    return empresa
  },

  async criar(data: CreateEmpresaDto) {
    if (await prisma.empresa.findUnique({ where: { cnpj: data.cnpj } }))   throw new ConflictError('CNPJ já cadastrado')
    if (await prisma.empresa.findUnique({ where: { email: data.email } })) throw new ConflictError('Email já cadastrado')
    return prisma.empresa.create({ data })
  },

  async atualizar(id: string, data: UpdateEmpresaDto) {
    await EmpresaService.buscarPorId(id)
    if (data.email) {
      const existe = await prisma.empresa.findFirst({ where: { email: data.email, NOT: { id } } })
      if (existe) throw new ConflictError('Email já em uso')
    }
    return prisma.empresa.update({ where: { id }, data })
  },

  async desativar(id: string) {
    await EmpresaService.buscarPorId(id)
    return prisma.empresa.update({ where: { id }, data: { status: 'Inativo' } })
  },

  async ativar(id: string) {
    const empresa = await prisma.empresa.findUnique({ where: { id } })
    if (!empresa) throw new NotFoundError('Empresa não encontrada')
    return prisma.empresa.update({ where: { id }, data: { status: 'Ativo' } })
  },

  async resumoDashboard() {
    const [
      totalEmpresas,
      empresasAtivas,
      empresasInativas,
      totalAlertas,
      alertasNaoLidos,
      porNivelRaw,
      resumoEmpresas,
    ] = await prisma.$transaction([
      prisma.empresa.count(),
      prisma.empresa.count({ where: { status: 'Ativo' } }),
      prisma.empresa.count({ where: { status: 'Inativo' } }),
      prisma.alerta.count(),
      prisma.alerta.count({ where: { lidoEm: null } }),
      (prisma.alerta.groupBy as any)({ by: ['nivel'], _count: true }),
      prisma.empresa.findMany({
        take: 10,
        orderBy: { criadoEm: 'desc' },
        include: {
          licencas:   { orderBy: { expiraEm: 'desc' }, take: 1, select: { plano: true, status: true } },
          pagamentos: { select: { valor: true, status: true } },
        },
      }),
    ])

    const porNivel: any = { razoavel: 0, medio: 0, critico: 0 }
    ;(porNivelRaw as any[]).forEach((p: any) => { porNivel[p.nivel] = p._count })

    const tabela = resumoEmpresas.map((e) => {
      const licencas      = e.licencas.length
      const totalPago     = e.pagamentos
        .filter((p) => p.status === 'Concluido')
        .reduce((acc, p) => acc + Number(p.valor), 0)
      const ultimaLicenca = e.licencas[0]
      const statusLicenca = ultimaLicenca?.status ?? 'Sem licença'

      return {
        empresa:        e.nome,
        licencaVendida: licencas,
        status:         statusLicenca,
        totalPago:      totalPago.toLocaleString('pt-AO', { minimumFractionDigits: 2 }) + ' AOA',
      }
    })

    return {
      cards: {
        totalEmpresas,
        empresasAtivas,
        empresasInativas,
        empresasSuspensas: empresasInativas,
      },
      alertas: {
        total:    totalAlertas,
        naoLidos: alertasNaoLidos,
        porNivel,
      },
      tabela,
    }
  },
}