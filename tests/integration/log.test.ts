import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import jwt from 'jsonwebtoken'

import { app } from '../../src/app'
import { LogService } from '../../src/modules/log/log.service'
import { Papel } from '../../src/shared/types/enums'

vi.mock('../../src/modules/log/log.service', () => ({
  LogService: {
    listar: vi.fn(),
    registrar: vi.fn(),
  },
}))

const JWT_SECRET = 'segredo-de-teste'

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
  empresaId: '11111111-1111-4111-8111-111111111111',
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

describe('Log - Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.JWT_SECRET = JWT_SECRET
  })

  describe('Autenticação', () => {
    it('rejeita requisição sem token', async () => {
      const response = await request(app).get('/api/v1/logs')

      expect(response.status).toBe(401)
      expect(response.body).toEqual({
        success: false,
        message: 'Token não fornecido',
      })
      expect(LogService.listar).not.toHaveBeenCalled()
    })

    it('rejeita token inválido', async () => {
      const response = await request(app)
        .get('/api/v1/logs')
        .set('Authorization', 'Bearer token-invalido')

      expect(response.status).toBe(401)
      expect(response.body).toEqual({
        success: false,
        message: 'Token inválido ou expirado',
      })
      expect(LogService.listar).not.toHaveBeenCalled()
    })
  })

  describe('Autorização por papel', () => {
    it('bloqueia Cliente', async () => {
      const response = await request(app)
        .get('/api/v1/logs')
        .set('Authorization', `Bearer ${tokenCliente}`)

      expect(response.status).toBe(403)
      expect(response.body).toEqual({
        success: false,
        message: 'Acesso negado para este papel',
      })
      expect(LogService.listar).not.toHaveBeenCalled()
    })

    it('permite ADM', async () => {
      vi.mocked(LogService.listar).mockResolvedValue({
        data: [],
        meta: { total: 0, pagina: 1, limite: 10, totalPaginas: 0 },
      } as never)

      const response = await request(app)
        .get('/api/v1/logs')
        .set('Authorization', `Bearer ${tokenAdmin}`)

      expect(response.status).toBe(200)
      expect(LogService.listar).toHaveBeenCalled()
    })

    it('permite Operacional', async () => {
      vi.mocked(LogService.listar).mockResolvedValue({
        data: [],
        meta: { total: 0, pagina: 1, limite: 10, totalPaginas: 0 },
      } as never)

      const response = await request(app)
        .get('/api/v1/logs')
        .set('Authorization', `Bearer ${tokenOperacional}`)

      expect(response.status).toBe(200)
      expect(LogService.listar).toHaveBeenCalled()
    })
  })

  describe('GET /api/v1/logs', () => {
    it('lista logs aplicando os filtros da query', async () => {
      vi.mocked(LogService.listar).mockResolvedValue({
        data: [
          { id: 'log-1', usuarioId: 'user-1', acao: 'LOGIN', statusHttp: 200 },
        ],
        meta: { total: 1, pagina: 1, limite: 10, totalPaginas: 1 },
      } as never)

      const response = await request(app)
        .get('/api/v1/logs')
        .query({ acao: 'login', statusHttp: '200' })
        .set('Authorization', `Bearer ${tokenAdmin}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(LogService.listar).toHaveBeenCalledWith(
        expect.objectContaining({ acao: 'login', statusHttp: '200' }),
      )
    })
  })
})
