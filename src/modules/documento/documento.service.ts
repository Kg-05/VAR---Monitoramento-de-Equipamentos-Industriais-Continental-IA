// src/modules/documento/documento.service.ts
import fs   from 'fs'
import path from 'path'
import { prisma }        from '@/shared/database/prisma.client'
import { NotFoundError } from '@/shared/errors/AppError'
import { parsePagination, paginar } from '@/shared/utils/page'

export interface ListarDocumentosQuery {
  [key: string]: unknown
  page?:      unknown
  limit?:     unknown
  search?:    string
  status?:    string
  empresaId?: string
}

export interface CriarDocumentoDto {
  empresaId:      string
  responsavelId?: string
  nomeArquivo:    string
  caminho:        string
}

export const DocumentoService = {
  async listar(query: ListarDocumentosQuery) {
    const pagination = parsePagination(query)
    const where: any = {}
    if (query.empresaId) where.empresaId = query.empresaId
    if (query.status)    where.status    = query.status
    if (query.search) {
      where.OR = [
        { nomeArquivo: { contains: query.search } },
        { empresa: { nome: { contains: query.search } } },
      ]
    }

    const [documentos, total] = await prisma.$transaction([
      prisma.documento.findMany({
        where, skip: pagination.skip, take: pagination.take,
        orderBy: { criadoEm: 'desc' },
        include: {
          empresa:     { select: { id: true, nome: true } },
          responsavel: { select: { id: true, nome: true } },
        },
      }),
      prisma.documento.count({ where }),
    ])
    return paginar(documentos, total, pagination)
  },

  async buscarPorId(id: string) {
    const doc = await prisma.documento.findUnique({
      where:   { id },
      include: { empresa: { select: { id: true, nome: true } }, responsavel: { select: { id: true, nome: true } } },
    })
    if (!doc) throw new NotFoundError('Documento não encontrado')
    return doc
  },

  async criar(data: CriarDocumentoDto) {
    return prisma.documento.create({
      data,
      include: { empresa: { select: { id: true, nome: true } }, responsavel: { select: { id: true, nome: true } } },
    })
  },

  async marcarComoLido(id: string) {
    await DocumentoService.buscarPorId(id)
    return prisma.documento.update({ where: { id }, data: { status: 'Lido' } })
  },

  async arquivar(id: string) {
    await DocumentoService.buscarPorId(id)
    return prisma.documento.update({ where: { id }, data: { status: 'Arquivado' } })
  },

  async remover(id: string) {
    const doc = await DocumentoService.buscarPorId(id)
    const caminhoCompleto = path.join(process.cwd(), doc.caminho)
    if (fs.existsSync(caminhoCompleto)) {
      fs.unlinkSync(caminhoCompleto)
    }
    return prisma.documento.delete({ where: { id } })
  },

  async resumo() {
    const [lidos, naoLidos, arquivados, total] = await prisma.$transaction([
      prisma.documento.count({ where: { status: 'Lido' } }),
      prisma.documento.count({ where: { status: 'NaoLido' } }),
      prisma.documento.count({ where: { status: 'Arquivado' } }),
      prisma.documento.count(),
    ])
    return { lidos, naoLidos, arquivados, total }
  },
}