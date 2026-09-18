import { describe, it, expect, vi, beforeEach } from 'vitest'
vi.mock('@/shared/database/prisma.client', () => ({ prisma: { $transaction: vi.fn(), alerta: { count: vi.fn(), groupBy: vi.fn() }, pagamento: { groupBy: vi.fn(), aggregate: vi.fn() }, licenca: { findMany: vi.fn(), groupBy: vi.fn() }, equipamento: { count: vi.fn(), groupBy: vi.fn(), findMany: vi.fn() }, empresa: { findMany: vi.fn() } } }))
vi.mock('@/shared/utils/licencaStatus', () => ({ calcularStatusLicenca: vi.fn(), diasParaExpirar: vi.fn() }))
vi.mock('@/shared/utils/decimal', () => ({ paraNumero: vi.fn((v: unknown) => Number(v)) }))
import { prisma } from '../../src/shared/database/prisma.client'
import { calcularStatusLicenca, diasParaExpirar } from '../../src/shared/utils/licencaStatus'
import { RelatorioService } from '../../src/modules/relatorio/relatorio.service'

describe('RelatorioService', () => {
  beforeEach(() => { vi.clearAllMocks(); vi.mocked(calcularStatusLicenca).mockReturnValue('Ativa' as never); vi.mocked(diasParaExpirar).mockReturnValue(10) })
  it('gera relatório de alertas com taxa de leitura e equipamentos', async () => {
    vi.mocked(prisma.$transaction).mockResolvedValue([10, 4, [{ nivel: 'critico', _count: 6 }], [{ equipamentoId: 'eq-1', _count: 5 }]] as never)
    vi.mocked(prisma.equipamento.findMany).mockResolvedValue([{ id: 'eq-1', nome: 'Bomba', localizacao: 'L1' }] as never)
    const result = await RelatorioService.alertas({ empresaId: 'emp-1' })
    expect(result).toMatchObject({ total: 10, naoLidos: 4, taxaLeitura: 60 })
    expect(result.porNivel).toEqual([{ nivel: 'critico', total: 6 }])
    expect(result.topEquipamentos[0]).toMatchObject({ totalAlertas: 5, equipamento: { id: 'eq-1' } })
  })
  it('calcula taxa de leitura como zero quando não há alertas', async () => {
    vi.mocked(prisma.$transaction).mockResolvedValue([0, 0, [], []] as never)
    vi.mocked(prisma.equipamento.findMany).mockResolvedValue([] as never)
    await expect(RelatorioService.alertas({})).resolves.toMatchObject({ taxaLeitura: 0 })
  })
  it('gera relatório financeiro', async () => {
    vi.mocked(prisma.$transaction).mockResolvedValue([[{ status: 'Concluido', _count: 2, _sum: { valor: 3000 } }], { _sum: { valor: 3000 } }, [{ empresaId: 'emp-1', _sum: { valor: 3000 } }]] as never)
    vi.mocked(prisma.empresa.findMany).mockResolvedValue([{ id: 'emp-1', nome: 'Empresa A' }] as never)
    const result = await RelatorioService.financeiro({ empresaId: 'emp-1' })
    expect(result.receitaTotal).toBe(3000)
    expect(result.porStatus[0]).toMatchObject({ status: 'Concluido', total: 2, valor: 3000 })
    expect(result.topEmpresas[0]).toMatchObject({ valorPago: 3000, empresa: { id: 'emp-1' } })
  })
  it('gera relatório de licenças com status calculado', async () => {
    const licenca = { id: 'lic-1', empresaId: 'emp-1', plano: 'Premium', status: 'Ativa', expiraEm: new Date('2026-12-01'), empresa: { id: 'emp-1', nome: 'Empresa A' } }
    vi.mocked(prisma.$transaction).mockResolvedValue([[licenca], [{ plano: 'Premium', _count: 1 }]] as never)
    vi.mocked(calcularStatusLicenca).mockReturnValue('Ativa' as never)
    vi.mocked(diasParaExpirar).mockReturnValue(20)
    const result = await RelatorioService.licencas({ empresaId: 'emp-1' })
    expect(result.total).toBe(1)
    expect(result.porStatus.ativas).toBe(1)
    expect(result.aExpirarEm30Dias).toHaveLength(1)
    expect(result.porPlano).toEqual([{ plano: 'Premium', total: 1 }])
  })
  it('gera relatório de equipamentos', async () => {
    const eq = { id: 'eq-1', nome: 'Bomba', empresaId: 'emp-1', _count: { alertas: 4 }, empresa: { id: 'emp-1', nome: 'Empresa A' } }
    vi.mocked(prisma.$transaction).mockResolvedValue([5, [{ status: 'Operacional', _count: 3 }], [eq]] as never)
    const result = await RelatorioService.equipamentos({ empresaId: 'emp-1' })
    expect(result.total).toBe(5)
    expect(result.porStatus).toEqual([{ status: 'Operacional', total: 3 }])
    expect(result.comMaisAlertas).toEqual([eq])
  })
})
