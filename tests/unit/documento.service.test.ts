import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/shared/database/prisma.client', () => ({ prisma: {
  $transaction: vi.fn(), documento: { findMany: vi.fn(), count: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
} }))
vi.mock('fs', () => ({ default: { existsSync: vi.fn(), unlinkSync: vi.fn() }, existsSync: vi.fn(), unlinkSync: vi.fn() }))

import { prisma } from '../../src/shared/database/prisma.client'
import fs from 'fs'
import { DocumentoService } from '../../src/modules/documento/documento.service'
import { NotFoundError } from '../../src/shared/errors/AppError'

const doc = { id: 'doc-1', empresaId: 'emp-1', responsavelId: 'user-1', nomeArquivo: 'relatorio.pdf', caminho: 'uploads/relatorio.pdf', status: 'NaoLido' }

describe('DocumentoService', () => {
  beforeEach(() => vi.clearAllMocks())

  it('lista documentos com filtros e paginação', async () => {
    vi.mocked(prisma.$transaction).mockResolvedValue([[doc] as never, 1] as never)
    const result = await DocumentoService.listar({ empresaId: 'emp-1', status: 'NaoLido', search: 'relatorio', page: 2, limit: 5 })
    expect(prisma.$transaction).toHaveBeenCalled()
    const calls = vi.mocked(prisma.documento.findMany).mock.calls
    expect(calls).toHaveLength(1)

expect(calls[0][0]).toMatchObject({
  where: expect.objectContaining({
    empresaId: 'emp-1',
    status: 'NaoLido',
  }),
}) // findMany is included as transaction argument, not executed by the mock
    expect(result.data).toEqual([doc])
  })

  it('busca documento por id', async () => {
    vi.mocked(prisma.documento.findUnique).mockResolvedValue(doc as never)
    await expect(DocumentoService.buscarPorId('doc-1')).resolves.toEqual(doc)
  })

  it('lança erro quando documento não existe', async () => {
    vi.mocked(prisma.documento.findUnique).mockResolvedValue(null)
    await expect(DocumentoService.buscarPorId('x')).rejects.toThrow(NotFoundError)
  })

  it('cria documento com os dados recebidos', async () => {
    vi.mocked(prisma.documento.create).mockResolvedValue(doc as never)
    const data = { empresaId: 'emp-1', responsavelId: 'user-1', nomeArquivo: 'a.pdf', caminho: 'uploads/a.pdf' }
    await expect(DocumentoService.criar(data)).resolves.toEqual(doc)
    expect(prisma.documento.create).toHaveBeenCalledWith(expect.objectContaining({ data }))
  })

  it('marca documento como lido depois de validar existência', async () => {
    vi.mocked(prisma.documento.findUnique).mockResolvedValue(doc as never)
    vi.mocked(prisma.documento.update).mockResolvedValue({ ...doc, status: 'Lido' } as never)
    await expect(DocumentoService.marcarComoLido('doc-1')).resolves.toMatchObject({ status: 'Lido' })
    expect(prisma.documento.update).toHaveBeenCalledWith({ where: { id: 'doc-1' }, data: { status: 'Lido' } })
  })

  it('arquiva documento depois de validar existência', async () => {
    vi.mocked(prisma.documento.findUnique).mockResolvedValue(doc as never)
    vi.mocked(prisma.documento.update).mockResolvedValue({ ...doc, status: 'Arquivado' } as never)
    await DocumentoService.arquivar('doc-1')
    expect(prisma.documento.update).toHaveBeenCalledWith({ where: { id: 'doc-1' }, data: { status: 'Arquivado' } })
  })

  it('remove ficheiro físico existente antes de apagar documento', async () => {
    vi.mocked(prisma.documento.findUnique).mockResolvedValue(doc as never)
    vi.mocked(fs.existsSync).mockReturnValue(true)
    vi.mocked(prisma.documento.delete).mockResolvedValue(doc as never)
    await DocumentoService.remover('doc-1')
    expect(fs.unlinkSync).toHaveBeenCalled()
    expect(prisma.documento.delete).toHaveBeenCalledWith({ where: { id: 'doc-1' } })
  })

  it('não tenta apagar ficheiro inexistente', async () => {
    vi.mocked(prisma.documento.findUnique).mockResolvedValue(doc as never)
    vi.mocked(fs.existsSync).mockReturnValue(false)
    vi.mocked(prisma.documento.delete).mockResolvedValue(doc as never)
    await DocumentoService.remover('doc-1')
    expect(fs.unlinkSync).not.toHaveBeenCalled()
  })

  it('gera resumo por estado', async () => {
    vi.mocked(prisma.$transaction).mockResolvedValue([2, 3, 1, 6] as never)
    await expect(DocumentoService.resumo()).resolves.toEqual({ lidos: 2, naoLidos: 3, arquivados: 1, total: 6 })
  })
})
