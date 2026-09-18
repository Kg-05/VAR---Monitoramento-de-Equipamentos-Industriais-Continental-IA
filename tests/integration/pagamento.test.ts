import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import jwt from 'jsonwebtoken'

import { NotFoundError, ConflictError } from '../../src/shared/errors/AppError'
import { app } from '../../src/app'
import { PagamentoService } from '../../src/modules/pagamento/pagamento.service'
import { Papel } from '../../src/shared/types/enums'

vi.mock('../../src/modules/pagamento/pagamento.service', () => ({
  PagamentoService: {
    listar: vi.fn(),
    buscarPorId: vi.fn(),
    criar: vi.fn(),
    atualizar: vi.fn(),
  },
}))

const JWT_SECRET = 'segredo-de-teste'

const EMP_TAAG = '11111111-1111-4111-8111-111111111111'
const LIC_ID = '33333333-3333-4333-8333-333333333333'
const PAG_ID = '44444444-4444-4444-8444-444444444444'

function gerarToken(payload: {
  id: string
  papel: Papel
  empresaId?: string | null
}) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' })
}

const tokenCliente = gerarToken({
  id: 'usuario-cliente',
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

describe('Pagamento - Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.JWT_SECRET = JWT_SECRET
  })

  describe('Autenticação', () => {
    it('rejeita requisição sem token', async () => {
      const response = await request(app).get('/api/v1/pagamentos')

      expect(response.status).toBe(401)
      expect(response.body).toEqual({
        success: false,
        message: 'Token não fornecido',
      })
      expect(PagamentoService.listar).not.toHaveBeenCalled()
    })

    it('rejeita token inválido', async () => {
      const response = await request(app)
        .get('/api/v1/pagamentos')
        .set('Authorization', 'Bearer token-invalido')

      expect(response.status).toBe(401)
      expect(response.body).toEqual({
        success: false,
        message: 'Token inválido ou expirado',
      })
      expect(PagamentoService.listar).not.toHaveBeenCalled()
    })
  })

  describe('Autorização por papel', () => {
    it('permite ao Cliente listar apenas os pagamentos da própria empresa', async () => {
      vi.mocked(PagamentoService.listar).mockResolvedValue({
        data: [],
        meta: { total: 0, pagina: 1, limite: 10, totalPaginas: 0 },
      } as never)

      const response = await request(app)
        .get('/api/v1/pagamentos')
        .set('Authorization', `Bearer ${tokenCliente}`)

      expect(response.status).toBe(200)
      expect(PagamentoService.listar).toHaveBeenCalledWith(
        expect.objectContaining({ empresaId: EMP_TAAG }),
      )
    })

    it('permite ADM', async () => {
      vi.mocked(PagamentoService.listar).mockResolvedValue({
        data: [],
        meta: { total: 0, pagina: 1, limite: 10, totalPaginas: 0 },
      } as never)

      const response = await request(app)
        .get('/api/v1/pagamentos')
        .set('Authorization', `Bearer ${tokenAdmin}`)

      expect(response.status).toBe(200)
      expect(PagamentoService.listar).toHaveBeenCalled()
    })

    it('permite Operacional', async () => {
      vi.mocked(PagamentoService.listar).mockResolvedValue({
        data: [],
        meta: { total: 0, pagina: 1, limite: 10, totalPaginas: 0 },
      } as never)

      const response = await request(app)
        .get('/api/v1/pagamentos')
        .set('Authorization', `Bearer ${tokenOperacional}`)

      expect(response.status).toBe(200)
      expect(PagamentoService.listar).toHaveBeenCalled()
    })
  })

  describe('GET /api/v1/pagamentos/:id', () => {
    it('busca um pagamento pelo ID', async () => {
      vi.mocked(PagamentoService.buscarPorId).mockResolvedValue({
        id: PAG_ID,
        empresaId: EMP_TAAG,
        valor: 1000,
      } as never)

      const response = await request(app)
        .get(`/api/v1/pagamentos/${PAG_ID}`)
        .set('Authorization', `Bearer ${tokenAdmin}`)

      expect(response.status).toBe(200)
      expect(PagamentoService.buscarPorId).toHaveBeenCalledWith(PAG_ID, undefined)
    })

    it('retorna 404 quando o pagamento não existe', async () => {
      vi.mocked(PagamentoService.buscarPorId).mockRejectedValue(
        new NotFoundError('Pagamento não encontrado'),
      )

      const response = await request(app)
        .get(`/api/v1/pagamentos/${PAG_ID}`)
        .set('Authorization', `Bearer ${tokenAdmin}`)

      expect(response.status).toBe(404)
      expect(response.body).toEqual({
        success: false,
        message: 'Pagamento não encontrado',
      })
    })

    it('não permite ao Cliente ver pagamento de outra empresa', async () => {
      vi.mocked(PagamentoService.buscarPorId).mockRejectedValue(
        new NotFoundError('Pagamento não encontrado'),
      )

      const response = await request(app)
        .get(`/api/v1/pagamentos/${PAG_ID}`)
        .set('Authorization', `Bearer ${tokenCliente}`)

      expect(response.status).toBe(404)
      expect(PagamentoService.buscarPorId).toHaveBeenCalledWith(PAG_ID, EMP_TAAG)
    })
  })

  describe('POST /api/v1/pagamentos', () => {
    it('rejeita dados inválidos', async () => {
      const response = await request(app)
        .post('/api/v1/pagamentos')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ empresaId: 'nao-e-uuid', licencaId: LIC_ID, valor: -10 })

      expect(response.status).toBe(400)
      expect(PagamentoService.criar).not.toHaveBeenCalled()
    })

    it('cria um pagamento válido', async () => {
      vi.mocked(PagamentoService.criar).mockResolvedValue({
        id: PAG_ID,
        empresaId: EMP_TAAG,
        licencaId: LIC_ID,
        valor: 1000,
      } as never)

      const response = await request(app)
        .post('/api/v1/pagamentos')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ empresaId: EMP_TAAG, licencaId: LIC_ID, valor: 1000 })

      expect(response.status).toBe(201)
      expect(PagamentoService.criar).toHaveBeenCalledWith(
        expect.objectContaining({ empresaId: EMP_TAAG, licencaId: LIC_ID, valor: 1000 }),
      )
    })

    it('propaga conflito quando a licença não pertence à empresa', async () => {
      vi.mocked(PagamentoService.criar).mockRejectedValue(
        new ConflictError('Licença não pertence a esta empresa'),
      )

      const response = await request(app)
        .post('/api/v1/pagamentos')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ empresaId: EMP_TAAG, licencaId: LIC_ID, valor: 1000 })

      expect(response.status).toBe(409)
      expect(response.body).toEqual({
        success: false,
        message: 'Licença não pertence a esta empresa',
      })
    })

    it('cliente usa a empresa do token ao submeter um pagamento', async () => {
      const EMP_SONANGOL = '22222222-2222-4222-8222-222222222222'
      vi.mocked(PagamentoService.criar).mockResolvedValue({ id: PAG_ID } as never)

      const response = await request(app)
        .post('/api/v1/pagamentos')
        .set('Authorization', `Bearer ${tokenCliente}`)
        .send({ empresaId: EMP_SONANGOL, licencaId: LIC_ID, valor: 1000 })

      expect(response.status).toBe(201)
      expect(PagamentoService.criar).toHaveBeenCalledWith(
        expect.objectContaining({ empresaId: EMP_TAAG }),
      )
      expect(PagamentoService.criar).not.toHaveBeenCalledWith(
        expect.objectContaining({ empresaId: EMP_SONANGOL }),
      )
    })
  })

  describe('PATCH /api/v1/pagamentos/:id', () => {
    it('impede cliente de concluir pagamento e renovar a licença', async () => {
      const response = await request(app)
        .patch(`/api/v1/pagamentos/${PAG_ID}`)
        .set('Authorization', `Bearer ${tokenCliente}`)
        .send({ status: 'Concluido' })

      expect(response.status).toBe(403)
      expect(PagamentoService.atualizar).not.toHaveBeenCalled()
    })

    it('permite ADM concluir pagamento', async () => {
      vi.mocked(PagamentoService.atualizar).mockResolvedValue({
        id: PAG_ID,
        status: 'Concluido',
      } as never)

      const response = await request(app)
        .patch(`/api/v1/pagamentos/${PAG_ID}`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ status: 'Concluido' })

      expect(response.status).toBe(200)
      expect(PagamentoService.atualizar).toHaveBeenCalledWith(
        PAG_ID,
        expect.objectContaining({ status: 'Concluido' }),
      )
    })

    it('rejeita status inválido', async () => {
      const response = await request(app)
        .patch(`/api/v1/pagamentos/${PAG_ID}`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ status: 'NaoExiste' })

      expect(response.status).toBe(400)
      expect(PagamentoService.atualizar).not.toHaveBeenCalled()
    })
  })
})
