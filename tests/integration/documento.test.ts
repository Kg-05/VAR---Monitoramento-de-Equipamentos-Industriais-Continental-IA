import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import jwt from 'jsonwebtoken'

import { NotFoundError } from '../../src/shared/errors/AppError'
import { app } from '../../src/app'
import { DocumentoService } from '../../src/modules/documento/documento.service'
import { Papel } from '../../src/shared/types/enums'

vi.mock('../../src/modules/documento/documento.service', () => ({
  DocumentoService: {
    listar: vi.fn(),
    buscarPorId: vi.fn(),
    criar: vi.fn(),
    marcarComoLido: vi.fn(),
    arquivar: vi.fn(),
    remover: vi.fn(),
    resumo: vi.fn(),
  },
}))

const JWT_SECRET = 'segredo-de-teste'

const EMP_TAAG = '11111111-1111-4111-8111-111111111111'
const EMP_SONANGOL = '22222222-2222-4222-8222-222222222222'

function gerarToken(payload: {
  id: string
  papel: Papel
  empresaId?: string | null
}) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' })
}

const tokenClienteTaag = gerarToken({
  id: 'usuario-taag',
  papel: Papel.Cliente,
  empresaId: EMP_TAAG,
})

const tokenAdmin = gerarToken({
  id: 'usuario-admin',
  papel: Papel.ADM,
  empresaId: null,
})

const tokenOperacional = gerarToken({
  id: 'usuario-operacional',
  papel: Papel.Operacional,
  empresaId: null,
})

describe('Documento - Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.JWT_SECRET = JWT_SECRET
  })

  describe('Autenticação', () => {
    it('rejeita requisição sem token', async () => {
      const response = await request(app).get('/api/v1/documentos')

      expect(response.status).toBe(401)
      expect(response.body).toEqual({
        success: false,
        message: 'Token não fornecido',
      })
      expect(DocumentoService.listar).not.toHaveBeenCalled()
    })

    it('rejeita token inválido', async () => {
      const response = await request(app)
        .get('/api/v1/documentos')
        .set('Authorization', 'Bearer token-invalido')

      expect(response.status).toBe(401)
      expect(response.body).toEqual({
        success: false,
        message: 'Token inválido ou expirado',
      })
      expect(DocumentoService.listar).not.toHaveBeenCalled()
    })
  })

  describe('GET /api/v1/documentos', () => {
    it('lista documentos para cliente autenticado, restrito à sua empresa', async () => {
      vi.mocked(DocumentoService.listar).mockResolvedValue({
        data: [
          { id: 'doc-taag-1', nomeArquivo: 'relatorio.pdf', empresaId: EMP_TAAG },
        ],
        meta: { total: 1, pagina: 1, limite: 10, totalPaginas: 1 },
      } as never)

      const response = await request(app)
        .get('/api/v1/documentos')
        .set('Authorization', `Bearer ${tokenClienteTaag}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(DocumentoService.listar).toHaveBeenCalledWith(
        expect.objectContaining({ empresaId: EMP_TAAG }),
      )
    })

    it('impõe o empresaId do cliente quando outro empresaId é enviado na query', async () => {
      vi.mocked(DocumentoService.listar).mockResolvedValue({
        data: [],
        meta: { total: 0, pagina: 1, limite: 10, totalPaginas: 0 },
      } as never)

      const response = await request(app)
        .get('/api/v1/documentos')
        .query({ empresaId: EMP_SONANGOL })
        .set('Authorization', `Bearer ${tokenClienteTaag}`)

      expect(response.status).toBe(200)
      expect(DocumentoService.listar).toHaveBeenCalledWith(
        expect.objectContaining({ empresaId: EMP_TAAG }),
      )
      expect(DocumentoService.listar).not.toHaveBeenCalledWith(
        expect.objectContaining({ empresaId: EMP_SONANGOL }),
      )
    })

    it('permite ADM listar sem restrição de empresa', async () => {
      vi.mocked(DocumentoService.listar).mockResolvedValue({
        data: [],
        meta: { total: 0, pagina: 1, limite: 10, totalPaginas: 0 },
      } as never)

      const response = await request(app)
        .get('/api/v1/documentos')
        .set('Authorization', `Bearer ${tokenAdmin}`)

      expect(response.status).toBe(200)
      expect(DocumentoService.listar).toHaveBeenCalled()
    })
  })

  describe('POST /api/v1/documentos', () => {
    it('rejeita envio sem ficheiro', async () => {
      const response = await request(app)
        .post('/api/v1/documentos')
        .set('Authorization', `Bearer ${tokenClienteTaag}`)
        .field('empresaId', EMP_TAAG)

      expect(response.status).toBe(400)
      expect(DocumentoService.criar).not.toHaveBeenCalled()
    })

    it('rejeita empresaId inválido', async () => {
      const response = await request(app)
        .post('/api/v1/documentos')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .field('empresaId', 'nao-e-um-uuid')
        .attach('arquivo', Buffer.from('conteudo'), 'comprovativo.pdf')

      expect(response.status).toBe(400)
      expect(DocumentoService.criar).not.toHaveBeenCalled()
    })

    it('cliente usa a empresa do token ao enviar documento', async () => {
      vi.mocked(DocumentoService.criar).mockResolvedValue({
        id: 'doc-novo',
        nomeArquivo: 'comprovativo.pdf',
        empresaId: EMP_TAAG,
        responsavelId: 'usuario-taag',
      } as never)

      const response = await request(app)
        .post('/api/v1/documentos')
        .set('Authorization', `Bearer ${tokenClienteTaag}`)
        .field('empresaId', EMP_SONANGOL)
        .attach('arquivo', Buffer.from('conteudo'), 'comprovativo.pdf')

      expect(response.status).toBe(201)
      expect(DocumentoService.criar).toHaveBeenCalledWith(
        expect.objectContaining({
          empresaId: EMP_TAAG,
          responsavelId: 'usuario-taag',
          nomeArquivo: 'comprovativo.pdf',
        }),
      )
      expect(DocumentoService.criar).not.toHaveBeenCalledWith(
        expect.objectContaining({ empresaId: EMP_SONANGOL }),
      )
    })

    it('exige empresaId quando enviado por ADM', async () => {
      const response = await request(app)
        .post('/api/v1/documentos')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .attach('arquivo', Buffer.from('conteudo'), 'comprovativo.pdf')

      expect(response.status).toBe(400)
      expect(DocumentoService.criar).not.toHaveBeenCalled()
    })
  })

  describe('PATCH /api/v1/documentos/:id/lido', () => {
    it('marca documento como lido respeitando o escopo da empresa', async () => {
      vi.mocked(DocumentoService.marcarComoLido).mockResolvedValue({
        id: 'doc-taag-1',
        status: 'Lido',
      } as never)

      const response = await request(app)
        .patch('/api/v1/documentos/doc-taag-1/lido')
        .set('Authorization', `Bearer ${tokenClienteTaag}`)

      expect(response.status).toBe(200)
      expect(DocumentoService.marcarComoLido).toHaveBeenCalledWith('doc-taag-1', EMP_TAAG)
    })

    it('não permite marcar documento de outra empresa como lido', async () => {
      vi.mocked(DocumentoService.marcarComoLido).mockRejectedValue(
        new NotFoundError('Documento não encontrado'),
      )

      const response = await request(app)
        .patch('/api/v1/documentos/doc-sonangol-1/lido')
        .set('Authorization', `Bearer ${tokenClienteTaag}`)

      expect(response.status).toBe(404)
      expect(response.body).toEqual({
        success: false,
        message: 'Documento não encontrado',
      })
    })
  })

  describe('PATCH /api/v1/documentos/:id/arquivar', () => {
    it('arquiva documento respeitando o escopo da empresa', async () => {
      vi.mocked(DocumentoService.arquivar).mockResolvedValue({
        id: 'doc-taag-1',
        status: 'Arquivado',
      } as never)

      const response = await request(app)
        .patch('/api/v1/documentos/doc-taag-1/arquivar')
        .set('Authorization', `Bearer ${tokenClienteTaag}`)

      expect(response.status).toBe(200)
      expect(DocumentoService.arquivar).toHaveBeenCalledWith('doc-taag-1', EMP_TAAG)
    })
  })

  describe('DELETE /api/v1/documentos/:id', () => {
    it('impede cliente de remover documento', async () => {
      const response = await request(app)
        .delete('/api/v1/documentos/doc-taag-1')
        .set('Authorization', `Bearer ${tokenClienteTaag}`)

      expect(response.status).toBe(403)
      expect(response.body).toEqual({
        success: false,
        message: 'Acesso negado para este papel',
      })
      expect(DocumentoService.remover).not.toHaveBeenCalled()
    })

    it('permite ADM remover documento', async () => {
      vi.mocked(DocumentoService.remover).mockResolvedValue(undefined as never)

      const response = await request(app)
        .delete('/api/v1/documentos/doc-taag-1')
        .set('Authorization', `Bearer ${tokenAdmin}`)

      expect(response.status).toBe(204)
      expect(DocumentoService.remover).toHaveBeenCalledWith('doc-taag-1')
    })

    it('permite Operacional remover documento', async () => {
      vi.mocked(DocumentoService.remover).mockResolvedValue(undefined as never)

      const response = await request(app)
        .delete('/api/v1/documentos/doc-taag-1')
        .set('Authorization', `Bearer ${tokenOperacional}`)

      expect(response.status).toBe(204)
      expect(DocumentoService.remover).toHaveBeenCalledWith('doc-taag-1')
    })
  })

  describe('GET /api/v1/documentos/resumo', () => {
    it('retorna resumo dos documentos da empresa do cliente', async () => {
      vi.mocked(DocumentoService.resumo).mockResolvedValue({
        lidos: 2,
        naoLidos: 3,
        arquivados: 1,
        total: 6,
      })

      const response = await request(app)
        .get('/api/v1/documentos/resumo')
        .set('Authorization', `Bearer ${tokenClienteTaag}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(DocumentoService.resumo).toHaveBeenCalledWith(EMP_TAAG)
    })
  })
})
