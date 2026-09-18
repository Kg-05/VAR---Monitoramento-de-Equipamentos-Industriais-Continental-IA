import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'

import { authRoutes } from '../../src/modules/auth/auth.routes'
import { AuthService } from '../../src/modules/auth/auth.service'

vi.mock('../../src/modules/auth/auth.service', () => ({
  AuthService: {
    login: vi.fn(),
  },
}))

const app = express()

app.use(express.json())
app.use(authRoutes)

app.use(
  (
    err: Error & { statusCode?: number },
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    return res.status(err.statusCode ?? 500).json({
      success: false,
      message: err.message,
    })
  }
)

describe('Auth - Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /auth/login', () => {
    it('realiza login com credenciais válidas', async () => {
      vi.mocked(AuthService.login).mockResolvedValue({
        token: 'token-de-teste',
        usuario: {
          id: 'usuario-1',
          nome: 'Carlos Mendes',
          email: 'gestor@sonangol-refinaria.ao',
          papel: 'Cliente',
          empresaId: 'empresa-1',
        },
      })

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'gestor@sonangol-refinaria.ao',
          senha: 'Cliente@123',
        })

      expect(response.status).toBe(200)

      expect(response.body).toMatchObject({
        success: true,
        data: {
          token: 'token-de-teste',
          usuario: {
            id: 'usuario-1',
            nome: 'Carlos Mendes',
            email: 'gestor@sonangol-refinaria.ao',
            papel: 'Cliente',
            empresaId: 'empresa-1',
          },
        },
      })

      expect(AuthService.login).toHaveBeenCalledWith({
        email: 'gestor@sonangol-refinaria.ao',
        senha: 'Cliente@123',
      })
    })

    it('rejeita email inválido', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'email-invalido',
          senha: 'Cliente@123',
        })

      expect(response.status).toBe(400)

      expect(AuthService.login).not.toHaveBeenCalled()
    })

    it('rejeita senha com menos de 6 caracteres', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'gestor@sonangol-refinaria.ao',
          senha: '123',
        })

      expect(response.status).toBe(400)

      expect(AuthService.login).not.toHaveBeenCalled()
    })

    it('rejeita requisição sem email', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          senha: 'Cliente@123',
        })

      expect(response.status).toBe(400)

      expect(AuthService.login).not.toHaveBeenCalled()
    })

    it('rejeita requisição sem senha', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'gestor@sonangol-refinaria.ao',
        })

      expect(response.status).toBe(400)

      expect(AuthService.login).not.toHaveBeenCalled()
    })

    it('propaga erro de credenciais inválidas', async () => {
      const erro = Object.assign(
        new Error('Credenciais inválidas'),
        { statusCode: 401 }
      )

      vi.mocked(AuthService.login).mockRejectedValue(erro)

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'gestor@sonangol-refinaria.ao',
          senha: 'SenhaErrada',
        })

      expect(response.status).toBe(401)

      expect(response.body).toEqual({
        success: false,
        message: 'Credenciais inválidas',
      })
    })
  })
})