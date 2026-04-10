// tests/unit/alerta.service.test.ts
// Exemplo de teste unitário com mock do Prisma
// Execute: npm run test

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock do prisma antes de importar o service
vi.mock('@/shared/database/prisma.client', () => ({
  prisma: {
    alerta: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
    },
    equipamento: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn((queries) => Promise.all(queries)),
  },
}))

import { prisma } from '@/shared/database/prisma.client'
import { AlertaService } from '@/modules/alerta/alerta'
import { NotFoundError, ConflictError } from '@/shared/errors/AppError'

const mockAlerta = {
  id:            'alerta-uuid-001',
  descricao:     'Temperatura elevada',
  nivel:         'critico' as const,
  empresaId:     'empresa-uuid-001',
  equipamentoId: 'equip-uuid-001',
  lidoPorId:     null,
  lidoEm:        null,
  criadoEm:      new Date(),
  updatedAt:     new Date(),
  equipamento:   { id: 'equip-uuid-001', nome: 'Bomba BC-01', localizacao: 'Piso 1' },
  empresa:       { id: 'empresa-uuid-001', nome: 'Sonangol' },
  lidoPor:       null,
}

const mockEquipamento = {
  id:        'equip-uuid-001',
  empresaId: 'empresa-uuid-001',
  nome:      'Bomba BC-01',
}

describe('AlertaService', () => {

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── criar ──────────────────────────────────────────────────

  describe('criar', () => {
    it('cria alerta quando equipamento pertence à empresa', async () => {
      vi.mocked(prisma.equipamento.findUnique).mockResolvedValue(mockEquipamento as any)
      vi.mocked(prisma.alerta.create).mockResolvedValue(mockAlerta as any)

      const resultado = await AlertaService.criar({
        empresaId:     'empresa-uuid-001',
        equipamentoId: 'equip-uuid-001',
        descricao:     'Temperatura elevada',
        nivel:         'critico',
      })

      expect(prisma.alerta.create).toHaveBeenCalledOnce()
      expect(resultado.nivel).toBe('critico')
    })

    it('lança NotFoundError quando equipamento não existe', async () => {
      vi.mocked(prisma.equipamento.findUnique).mockResolvedValue(null)

      await expect(
        AlertaService.criar({
          empresaId:     'empresa-uuid-001',
          equipamentoId: 'equip-inexistente',
          descricao:     'Teste',
          nivel:         'medio',
        })
      ).rejects.toThrow(NotFoundError)
    })

    it('lança ConflictError quando equipamento não pertence à empresa', async () => {
      vi.mocked(prisma.equipamento.findUnique).mockResolvedValue({
        ...mockEquipamento,
        empresaId: 'outra-empresa-uuid',
      } as any)

      await expect(
        AlertaService.criar({
          empresaId:     'empresa-uuid-001',
          equipamentoId: 'equip-uuid-001',
          descricao:     'Teste',
          nivel:         'medio',
        })
      ).rejects.toThrow(ConflictError)
    })
  })

  // ── marcarComoLido ─────────────────────────────────────────

  describe('marcarComoLido', () => {
    it('marca alerta como lido com usuárioId e timestamp', async () => {
      vi.mocked(prisma.alerta.findUnique).mockResolvedValue(mockAlerta as any)
      vi.mocked(prisma.alerta.update).mockResolvedValue({
        ...mockAlerta,
        lidoPorId: 'usuario-uuid-001',
        lidoEm:    new Date(),
      } as any)

      const resultado = await AlertaService.marcarComoLido(
        'alerta-uuid-001',
        'usuario-uuid-001',
        'empresa-uuid-001',
      )

      expect(prisma.alerta.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ lidoPorId: 'usuario-uuid-001' }),
        })
      )
      expect(resultado.lidoPorId).toBe('usuario-uuid-001')
    })

    it('lança ConflictError quando alerta já foi lido', async () => {
      vi.mocked(prisma.alerta.findUnique).mockResolvedValue({
        ...mockAlerta,
        lidoEm: new Date(),
      } as any)

      await expect(
        AlertaService.marcarComoLido('alerta-uuid-001', 'usuario-uuid-001')
      ).rejects.toThrow(ConflictError)
    })

    it('lança NotFoundError quando empresaId não coincide (multi-tenant)', async () => {
      vi.mocked(prisma.alerta.findUnique).mockResolvedValue({
        ...mockAlerta,
        empresaId: 'outra-empresa',
      } as any)

      await expect(
        AlertaService.marcarComoLido('alerta-uuid-001', 'usuario-uuid-001', 'empresa-uuid-001')
      ).rejects.toThrow(NotFoundError)
    })
  })

  // ── resumo ─────────────────────────────────────────────────

  describe('resumo', () => {
    it('retorna contagens corretas por nível', async () => {
      vi.mocked(prisma.$transaction).mockResolvedValue([
        10,
        4,
        [
          { nivel: 'critico',  _count: { nivel: 2 } },
          { nivel: 'medio',    _count: { nivel: 5 } },
          { nivel: 'razoavel', _count: { nivel: 3 } },
        ],
      ] as any)

      const resultado = await AlertaService.resumo('empresa-uuid-001')

      expect(resultado.total).toBe(10)
      expect(resultado.naoLidos).toBe(4)
      expect(resultado.porNivel.critico).toBe(2)
      expect(resultado.porNivel.medio).toBe(5)
      expect(resultado.porNivel.razoavel).toBe(3)
    })
  })
})
