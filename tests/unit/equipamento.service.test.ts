import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Prisma, StatusEquipamento } from '@prisma/client'

vi.mock('@/shared/database/prisma.client', () => ({
  prisma: {
    equipamento: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    alerta: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

import { prisma } from '../../src/shared/database/prisma.client'
import { EquipamentoService } from '../../src/modules/equipamento/equipamento.service'
import {
  ConflictError,
  NotFoundError,
} from '../../src/shared/errors/AppError'

const empresaId = 'empresa-uuid-001'
const outraEmpresaId = 'empresa-uuid-002'
const equipamentoId = 'equipamento-uuid-001'

type EquipamentoComEmpresa = Prisma.EquipamentoGetPayload<{
  include: {
    empresa: {
      select: {
        id: true
        nome: true
      }
    }
  }
}>

type EquipamentoComDetalhes = Prisma.EquipamentoGetPayload<{
  include: {
    empresa: {
      select: {
        id: true
        nome: true
      }
    }
    alertas: {
      orderBy: {
        criadoEm: 'desc'
      }
      take: 5
      select: {
        id: true
        nivel: true
        descricao: true
        criadoEm: true
        lidoEm: true
      }
    }
  }
}>

const mockEquipamento: EquipamentoComEmpresa = {
  id: equipamentoId,
  nome: 'Bomba BC-01',
  modelo: 'Grundfos CR 64-3',
  fabricante: 'Grundfos',
  numeroSerie: 'GF-2021-BC01',
  localizacao: 'Unidade de Destilação',
  status: StatusEquipamento.Operacional,
  criadoEm: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  empresaId,
  empresa: {
    id: empresaId,
    nome: 'Sonangol Refinaria Luanda',
  },
}

const mockEquipamentoDetalhado: EquipamentoComDetalhes = {
  ...mockEquipamento,
  alertas: [],
}

describe('EquipamentoService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ============================================================
  // listar
  // ============================================================

  describe('listar', () => {
    it('lista equipamentos com paginação', async () => {
      vi.mocked(prisma.$transaction).mockResolvedValue([
        [mockEquipamento],
        1,
      ])

      const resultado = await EquipamentoService.listar({})

      expect(resultado.data).toHaveLength(1)
      expect(resultado.data[0].id).toBe(equipamentoId)
      expect(resultado.meta.total).toBe(1)
      expect(resultado.meta.page).toBe(1)
      expect(resultado.meta.limit).toBe(20)
      expect(resultado.meta.totalPages).toBe(1)

      expect(prisma.$transaction).toHaveBeenCalledOnce()
    })

    it('aplica filtro por empresaId', async () => {
      vi.mocked(prisma.$transaction).mockResolvedValue([
        [mockEquipamento],
        1,
      ])

      await EquipamentoService.listar({
        empresaId,
      })

      const transactionArgs = vi.mocked(prisma.$transaction).mock.calls[0][0]

      expect(transactionArgs).toHaveLength(2)
    })

    it('aplica filtro por status', async () => {
      vi.mocked(prisma.$transaction).mockResolvedValue([
        [mockEquipamento],
        1,
      ])

      await EquipamentoService.listar({
        status: StatusEquipamento.Manutencao,
      })

      expect(prisma.$transaction).toHaveBeenCalledOnce()
    })

    it('aplica filtro de pesquisa', async () => {
      vi.mocked(prisma.$transaction).mockResolvedValue([
        [mockEquipamento],
        1,
      ])

      await EquipamentoService.listar({
        search: 'Bomba',
      })

      expect(prisma.$transaction).toHaveBeenCalledOnce()
    })

    it('respeita paginação personalizada', async () => {
      vi.mocked(prisma.$transaction).mockResolvedValue([
        [mockEquipamento],
        25,
      ])

      const resultado = await EquipamentoService.listar({
        page: '2',
        limit: '10',
      })

      expect(resultado.meta.page).toBe(2)
      expect(resultado.meta.limit).toBe(10)
      expect(resultado.meta.total).toBe(25)
      expect(resultado.meta.totalPages).toBe(3)
    })
  })

  // ============================================================
  // buscarPorId
  // ============================================================

  describe('buscarPorId', () => {
    it('retorna equipamento existente', async () => {
      vi.mocked(prisma.equipamento.findUnique)
        .mockResolvedValue(mockEquipamentoDetalhado)

      const resultado = await EquipamentoService.buscarPorId(equipamentoId)

      expect(resultado.id).toBe(equipamentoId)
      expect(resultado.nome).toBe('Bomba BC-01')

      expect(prisma.equipamento.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: equipamentoId },
        }),
      )
    })

    it('lança NotFoundError quando equipamento não existe', async () => {
      vi.mocked(prisma.equipamento.findUnique)
        .mockResolvedValue(null)

      await expect(
        EquipamentoService.buscarPorId('equipamento-inexistente'),
      ).rejects.toThrow(NotFoundError)
    })

    it('bloqueia equipamento de outra empresa', async () => {
      vi.mocked(prisma.equipamento.findUnique)
        .mockResolvedValue({
          ...mockEquipamentoDetalhado,
          empresaId: outraEmpresaId,
        })

      await expect(
        EquipamentoService.buscarPorId(
          equipamentoId,
          empresaId,
        ),
      ).rejects.toThrow(NotFoundError)
    })

    it('permite equipamento quando empresaId coincide', async () => {
      vi.mocked(prisma.equipamento.findUnique)
        .mockResolvedValue(mockEquipamentoDetalhado)

      const resultado = await EquipamentoService.buscarPorId(
        equipamentoId,
        empresaId,
      )

      expect(resultado.empresaId).toBe(empresaId)
    })
  })

  // ============================================================
  // criar
  // ============================================================

  describe('criar', () => {
    const dados = {
      empresaId,
      nome: 'Compressor CA-02',
      modelo: 'Atlas Copco GA 55',
      fabricante: 'Atlas Copco',
      numeroSerie: 'AC-2026-CA02',
      localizacao: 'Casa de Compressores',
    }

    it('cria equipamento com dados válidos', async () => {
      vi.mocked(prisma.equipamento.findFirst)
        .mockResolvedValue(null)

      vi.mocked(prisma.equipamento.create)
        .mockResolvedValue(mockEquipamento)

      const resultado = await EquipamentoService.criar(dados)

      expect(prisma.equipamento.findFirst).toHaveBeenCalledWith({
        where: {
          numeroSerie: dados.numeroSerie,
          empresaId,
        },
      })

      expect(prisma.equipamento.create).toHaveBeenCalledOnce()
      expect(resultado.id).toBe(equipamentoId)
    })

    it('não permite número de série duplicado na mesma empresa', async () => {
      vi.mocked(prisma.equipamento.findFirst)
        .mockResolvedValue(mockEquipamento)

      await expect(
        EquipamentoService.criar(dados),
      ).rejects.toThrow(ConflictError)

      expect(prisma.equipamento.create).not.toHaveBeenCalled()
    })

    it('permite o mesmo número de série em outra empresa', async () => {
      vi.mocked(prisma.equipamento.findFirst)
        .mockResolvedValue(null)

      vi.mocked(prisma.equipamento.create)
        .mockResolvedValue({
          ...mockEquipamento,
          empresaId: outraEmpresaId,
        })

      const resultado = await EquipamentoService.criar({
        ...dados,
        empresaId: outraEmpresaId,
      })

      expect(resultado.empresaId).toBe(outraEmpresaId)
      expect(prisma.equipamento.create).toHaveBeenCalledOnce()
    })
  })

  // ============================================================
  // atualizar
  // ============================================================

  describe('atualizar', () => {
    it('atualiza equipamento existente', async () => {
      vi.mocked(prisma.equipamento.findUnique)
        .mockResolvedValue(mockEquipamentoDetalhado)

      vi.mocked(prisma.equipamento.update)
        .mockResolvedValue({
          ...mockEquipamento,
          nome: 'Bomba BC-01 Atualizada',
        })

      const resultado = await EquipamentoService.atualizar(
        equipamentoId,
        {
          nome: 'Bomba BC-01 Atualizada',
        },
        empresaId,
      )

      expect(prisma.equipamento.update).toHaveBeenCalledWith({
        where: { id: equipamentoId },
        data: {
          nome: 'Bomba BC-01 Atualizada',
        },
      })

      expect(resultado.nome).toBe('Bomba BC-01 Atualizada')
    })

    it('não atualiza equipamento de outra empresa', async () => {
      vi.mocked(prisma.equipamento.findUnique)
        .mockResolvedValue({
          ...mockEquipamentoDetalhado,
          empresaId: outraEmpresaId,
        })

      await expect(
        EquipamentoService.atualizar(
          equipamentoId,
          { nome: 'Tentativa indevida' },
          empresaId,
        ),
      ).rejects.toThrow(NotFoundError)

      expect(prisma.equipamento.update).not.toHaveBeenCalled()
    })

    it('lança NotFoundError quando equipamento não existe', async () => {
      vi.mocked(prisma.equipamento.findUnique)
        .mockResolvedValue(null)

      await expect(
        EquipamentoService.atualizar(
          equipamentoId,
          { nome: 'Teste' },
          empresaId,
        ),
      ).rejects.toThrow(NotFoundError)

      expect(prisma.equipamento.update).not.toHaveBeenCalled()
    })

    it('cria alerta quando equipamento passa para manutenção', async () => {
      vi.mocked(prisma.equipamento.findUnique)
        .mockResolvedValue(mockEquipamentoDetalhado)

      vi.mocked(prisma.equipamento.update)
        .mockResolvedValue({
          ...mockEquipamento,
          status: StatusEquipamento.Manutencao,
        })

      vi.mocked(prisma.alerta.create)
        .mockResolvedValue({
          id: 'alerta-001',
          descricao:
            'Equipamento "Bomba BC-01" entrou em modo de manutenção',
          nivel: 'medio',
          empresaId,
          equipamentoId,
          lidoPorId: null,
          lidoEm: null,
          criadoEm: new Date(),
          updatedAt: new Date(),
        })

      await EquipamentoService.atualizar(
        equipamentoId,
        {
          status: StatusEquipamento.Manutencao,
        },
        empresaId,
      )

      expect(prisma.alerta.create).toHaveBeenCalledWith({
        data: {
          descricao:
            'Equipamento "Bomba BC-01" entrou em modo de manutenção',
          nivel: 'medio',
          empresaId,
          equipamentoId,
        },
      })
    })

    it('não cria alerta quando já estava em manutenção', async () => {
      vi.mocked(prisma.equipamento.findUnique)
        .mockResolvedValue({
          ...mockEquipamentoDetalhado,
          status: StatusEquipamento.Manutencao,
        })

      vi.mocked(prisma.equipamento.update)
        .mockResolvedValue({
          ...mockEquipamento,
          status: StatusEquipamento.Manutencao,
        })

      await EquipamentoService.atualizar(
        equipamentoId,
        {
          status: StatusEquipamento.Manutencao,
        },
        empresaId,
      )

      expect(prisma.alerta.create).not.toHaveBeenCalled()
    })
  })

  // ============================================================
  // remover
  // ============================================================

  describe('remover', () => {
    it('remove equipamento existente', async () => {
      vi.mocked(prisma.equipamento.findUnique)
        .mockResolvedValue(mockEquipamentoDetalhado)

      vi.mocked(prisma.equipamento.delete)
        .mockResolvedValue(mockEquipamento)

      const resultado = await EquipamentoService.remover(equipamentoId)

      expect(prisma.equipamento.delete).toHaveBeenCalledWith({
        where: {
          id: equipamentoId,
        },
      })

      expect(resultado.id).toBe(equipamentoId)
    })

    it('não remove equipamento inexistente', async () => {
      vi.mocked(prisma.equipamento.findUnique)
        .mockResolvedValue(null)

      await expect(
        EquipamentoService.remover('equipamento-inexistente'),
      ).rejects.toThrow(NotFoundError)

      expect(prisma.equipamento.delete).not.toHaveBeenCalled()
    })
  })
})