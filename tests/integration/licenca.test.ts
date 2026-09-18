import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import jwt from 'jsonwebtoken'

import { NotFoundError, ConflictError } from '../../src/shared/errors/AppError'
import { app } from '../../src/app'
import { LicencaService } from '../../src/modules/licenca/licenca.service'
import { Papel } from '../../src/shared/types/enums'

vi.mock('../../src/modules/licenca/licenca.service', () => ({
  LicencaService: {
    listar: vi.fn(),
    buscarPorId: vi.fn(),
    criar: vi.fn(),
    atualizar: vi.fn(),
  },
}))

const JWT_SECRET = 'segredo-de-teste'

const EMP_TAAG = '11111111-1111-4111-8111-111111111111'
const LIC_ID = '33333333-3333-4333-8333-333333333333'

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

describe('Licença - Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.JWT_SECRET = JWT_SECRET
  })

  describe('Autenticação', () => {
    it('rejeita requisição sem token', async () => {
      const response = await request(app).get('/api/v1/licencas')

      expect(response.status).toBe(401)
      expect(response.body).toEqual({
        success: false,
        message: 'Token não fornecido',
      })
      expect(LicencaService.listar).not.toHaveBeenCalled()
    })

    it('rejeita token inválido', async () => {
      const response = await request(app)
        .get('/api/v1/licencas')
        .set('Authorization', 'Bearer token-invalido')

      expect(response.status).toBe(401)
      expect(response.body).toEqual({
        success: false,
        message: 'Token inválido ou expirado',
      })
      expect(LicencaService.listar).not.toHaveBeenCalled()
    })
  })

  describe('Autorização por papel', () => {
    it('bloqueia Cliente em todas as rotas de licenças', async () => {
      const response = await request(app)
        .get('/api/v1/licencas')
        .set('Authorization', `Bearer ${tokenClienteTaag}`)

      expect(response.status).toBe(403)
      expect(response.body).toEqual({
        success: false,
        message: 'Acesso negado para este papel',
      })
      expect(LicencaService.listar).not.toHaveBeenCalled()
    })

    it('permite ADM', async () => {
      vi.mocked(LicencaService.listar).mockResolvedValue({
        data: [],
        meta: { total: 0, pagina: 1, limite: 10, totalPaginas: 0 },
      } as never)

      const response = await request(app)
        .get('/api/v1/licencas')
        .set('Authorization', `Bearer ${tokenAdmin}`)

      expect(response.status).toBe(200)
      expect(LicencaService.listar).toHaveBeenCalled()
    })

    it('permite Operacional', async () => {
      vi.mocked(LicencaService.listar).mockResolvedValue({
        data: [],
        meta: { total: 0, pagina: 1, limite: 10, totalPaginas: 0 },
      } as never)

      const response = await request(app)
        .get('/api/v1/licencas')
        .set('Authorization', `Bearer ${tokenOperacional}`)

      expect(response.status).toBe(200)
      expect(LicencaService.listar).toHaveBeenCalled()
    })
  })

  describe('GET /api/v1/licencas/:id', () => {
    it('busca uma licença pelo ID', async () => {
      vi.mocked(LicencaService.buscarPorId).mockResolvedValue({
        id: LIC_ID,
        empresaId: EMP_TAAG,
        plano: 'Premium',
      } as never)

      const response = await request(app)
        .get(`/api/v1/licencas/${LIC_ID}`)
        .set('Authorization', `Bearer ${tokenAdmin}`)

      expect(response.status).toBe(200)
      expect(LicencaService.buscarPorId).toHaveBeenCalledWith(LIC_ID)
    })

    it('retorna 404 quando a licença não existe', async () => {
      vi.mocked(LicencaService.buscarPorId).mockRejectedValue(
        new NotFoundError('Licença não encontrada'),
      )

      const response = await request(app)
        .get(`/api/v1/licencas/${LIC_ID}`)
        .set('Authorization', `Bearer ${tokenAdmin}`)

      expect(response.status).toBe(404)
      expect(response.body).toEqual({
        success: false,
        message: 'Licença não encontrada',
      })
    })
  })

  describe('POST /api/v1/licencas', () => {
    it('rejeita dados inválidos', async () => {
      const response = await request(app)
        .post('/api/v1/licencas')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ empresaId: 'nao-e-uuid', plano: 'Premium' })

      expect(response.status).toBe(400)
      expect(LicencaService.criar).not.toHaveBeenCalled()
    })

    it('cria uma licença válida', async () => {
      vi.mocked(LicencaService.criar).mockResolvedValue({
        id: LIC_ID,
        empresaId: EMP_TAAG,
        plano: 'Premium',
      } as never)

      const response = await request(app)
        .post('/api/v1/licencas')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          empresaId: EMP_TAAG,
          plano: 'Premium',
          maxDeFuncionarios: 10,
          inicioEm: '2026-01-01',
          expiraEm: '2027-01-01',
        })

      expect(response.status).toBe(201)
      expect(LicencaService.criar).toHaveBeenCalledWith(
        expect.objectContaining({ empresaId: EMP_TAAG, plano: 'Premium', maxDeFuncionarios: 10 }),
      )
    })

    it('propaga conflito quando as datas são inválidas', async () => {
      vi.mocked(LicencaService.criar).mockRejectedValue(
        new ConflictError('Data de início deve ser anterior à expiração'),
      )

      const response = await request(app)
        .post('/api/v1/licencas')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          empresaId: EMP_TAAG,
          plano: 'Premium',
          maxDeFuncionarios: 10,
          inicioEm: '2027-01-01',
          expiraEm: '2026-01-01',
        })

      expect(response.status).toBe(409)
      expect(response.body).toEqual({
        success: false,
        message: 'Data de início deve ser anterior à expiração',
      })
    })

    it('permite Operacional criar licença', async () => {
      vi.mocked(LicencaService.criar).mockResolvedValue({ id: LIC_ID } as never)

      const response = await request(app)
        .post('/api/v1/licencas')
        .set('Authorization', `Bearer ${tokenOperacional}`)
        .send({
          empresaId: EMP_TAAG,
          plano: 'Basico',
          maxDeFuncionarios: 5,
          inicioEm: '2026-01-01',
          expiraEm: '2027-01-01',
        })

      expect(response.status).toBe(201)
    })
  })

  describe('PATCH /api/v1/licencas/:id', () => {
    it('atualiza uma licença', async () => {
      vi.mocked(LicencaService.atualizar).mockResolvedValue({
        id: LIC_ID,
        status: 'Suspensa',
      } as never)

      const response = await request(app)
        .patch(`/api/v1/licencas/${LIC_ID}`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ status: 'Suspensa' })

      expect(response.status).toBe(200)
      expect(LicencaService.atualizar).toHaveBeenCalledWith(
        LIC_ID,
        expect.objectContaining({ status: 'Suspensa' }),
      )
    })

    it('rejeita atualização com dados inválidos', async () => {
      const response = await request(app)
        .patch(`/api/v1/licencas/${LIC_ID}`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ status: 'NaoExiste' })

      expect(response.status).toBe(400)
      expect(LicencaService.atualizar).not.toHaveBeenCalled()
    })
  })
})
