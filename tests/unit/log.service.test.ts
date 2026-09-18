import { describe, it, expect, vi, beforeEach } from 'vitest'
vi.mock('@/shared/database/prisma.client', () => ({ prisma: { $transaction: vi.fn(), log: { findMany: vi.fn(), count: vi.fn(), create: vi.fn() } } }))
import { prisma } from '../../src/shared/database/prisma.client'
import { LogService } from '../../src/modules/log/log.service'

const log = { id: 'log-1', usuarioId: 'user-1', empresaId: 'emp-1', nivelUsuario: 'ADM', acao: 'LOGIN', statusHttp: 200 }

describe('LogService', () => {
  beforeEach(() => vi.clearAllMocks())
  it('lista logs com filtros', async () => {
    vi.mocked(prisma.$transaction).mockResolvedValue([[log] as never, 1] as never)
    const result = await LogService.listar({ usuarioId: 'user-1', empresaId: 'emp-1', papel: 'ADM', statusHttp: '200', acao: 'login', dataInicio: '2026-01-01' })
    expect(result.data).toEqual([log])
  })
  it('registra log com os dados recebidos', async () => {
    vi.mocked(prisma.log.create).mockResolvedValue(log as never)
    const data = { usuarioId: 'user-1', empresaId: 'emp-1', nivelUsuario: 'ADM' as never, acao: 'LOGIN', ip: '127.0.0.1', statusHttp: 200 }
    await expect(LogService.registrar(data)).resolves.toEqual(log)
    expect(prisma.log.create).toHaveBeenCalledWith({ data })
  })
})
