import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import jwt from 'jsonwebtoken'

import { NotFoundError } from '../../src/shared/errors/AppError'
import { app } from '../../src/app'
import { AlertaService } from '../../src/modules/alerta/alerta.service'
import { Papel } from '../../src/shared/types/enums'

vi.mock('../../src/modules/alerta/alerta.service', () => ({
  AlertaService: {
    listar: vi.fn(),
    buscarPorId: vi.fn(),
    criar: vi.fn(),
    marcarComoLido: vi.fn(),
    remover: vi.fn(),
    resumo: vi.fn(),
    naoLidosRecentes: vi.fn(),
  },
}))

const JWT_SECRET = 'segredo-de-teste'

const EMP_TAAG = '11111111-1111-4111-8111-111111111111'
const EMP_SONANGOL = '22222222-2222-4222-8222-222222222222'

const EQUIP_TAAG = '33333333-3333-4333-8333-333333333333'
const EQUIP_SONANGOL = '44444444-4444-4444-8444-444444444444'

function gerarToken(payload: {
  id: string
  papel: Papel
  empresaId?: string | null
}) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '1h',
  })
}

const tokenClienteTaag = gerarToken({
  id: 'usuario-taag',
  papel: Papel.Cliente,
  empresaId: EMP_TAAG,
})

const tokenClienteSonangol = gerarToken({
  id: 'usuario-sonangol',
  papel: Papel.Cliente,
  empresaId: EMP_SONANGOL,
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

describe('Alerta - Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    process.env.JWT_SECRET = JWT_SECRET
  })

  describe('Autenticação', () => {
    it('rejeita requisição sem token', async () => {
      const response = await request(app)
        .get('/api/v1/alertas')

      expect(response.status).toBe(401)

      expect(response.body).toEqual({
        success: false,
        message: 'Token não fornecido',
      })

      expect(AlertaService.listar).not.toHaveBeenCalled()
    })

    it('rejeita token inválido', async () => {
      const response = await request(app)
        .get('/api/v1/alertas')
        .set('Authorization', 'Bearer token-invalido')

      expect(response.status).toBe(401)

      expect(response.body).toEqual({
        success: false,
        message: 'Token inválido ou expirado',
      })

      expect(AlertaService.listar).not.toHaveBeenCalled()
    })

    it('rejeita token com payload inválido', async () => {
      const token = jwt.sign(
        {
          id: 'usuario-1',
          papel: 'PapelInventado',
          empresaId: EMP_TAAG,
        },
        JWT_SECRET,
        { expiresIn: '1h' },
      )

      const response = await request(app)
        .get('/api/v1/alertas')
        .set('Authorization', `Bearer ${token}`)

      expect(response.status).toBe(401)

      expect(response.body).toEqual({
        success: false,
        message: 'Token inválido',
      })

      expect(AlertaService.listar).not.toHaveBeenCalled()
    })
  })

  describe('GET /api/v1/alertas', () => {
    it('lista alertas para cliente autenticado', async () => {
      vi.mocked(AlertaService.listar).mockResolvedValue({
        data: [
          {
            id: 'alerta-taag-1',
            descricao: 'Desgaste acima do esperado',
            nivel: 'medio',
            empresaId: EMP_TAAG,
          },
        ],
        meta: {
          total: 1,
          pagina: 1,
          limite: 10,
          totalPaginas: 1,
        },
      } as never)

      const response = await request(app)
        .get('/api/v1/alertas')
        .set('Authorization', `Bearer ${tokenClienteTaag}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)

      expect(AlertaService.listar).toHaveBeenCalledWith(
        expect.objectContaining({
          empresaId: EMP_TAAG,
        }),
      )
    })

    it('impõe o empresaId do cliente quando outro empresaId é enviado na query', async () => {
      vi.mocked(AlertaService.listar).mockResolvedValue({
        data: [],
        meta: {
          total: 0,
          pagina: 1,
          limite: 10,
          totalPaginas: 0,
        },
      } as never)

      const response = await request(app)
        .get('/api/v1/alertas')
        .query({
          empresaId: EMP_SONANGOL,
        })
        .set('Authorization', `Bearer ${tokenClienteTaag}`)

      expect(response.status).toBe(200)

      expect(AlertaService.listar).toHaveBeenCalledWith(
        expect.objectContaining({
          empresaId: EMP_TAAG,
        }),
      )

      expect(AlertaService.listar).not.toHaveBeenCalledWith(
        expect.objectContaining({
          empresaId: EMP_SONANGOL,
        }),
      )
    })
  })

  describe('GET /api/v1/alertas/:id', () => {
    it('passa o empresaId do cliente para o serviço', async () => {
      vi.mocked(AlertaService.buscarPorId).mockResolvedValue({
        id: 'alerta-taag-1',
        descricao: 'Desgaste acima do esperado',
        nivel: 'medio',
        empresaId: EMP_TAAG,
      } as never)

      const response = await request(app)
        .get('/api/v1/alertas/alerta-taag-1')
        .set('Authorization', `Bearer ${tokenClienteTaag}`)

      expect(response.status).toBe(200)

      expect(AlertaService.buscarPorId).toHaveBeenCalledWith(
        'alerta-taag-1',
        EMP_TAAG,
      )
    })

    it('não permite ao cliente acessar alerta de outra empresa', async () => {
      vi.mocked(AlertaService.buscarPorId).mockRejectedValue(
        new NotFoundError('Alerta não encontrado'),
      )

      const response = await request(app)
        .get('/api/v1/alertas/alerta-sonangol-1')
        .set('Authorization', `Bearer ${tokenClienteTaag}`)

      expect(response.status).toBe(404)

      expect(response.body).toEqual({
        success: false,
        message: 'Alerta não encontrado',
      })

      expect(AlertaService.buscarPorId).toHaveBeenCalledWith(
        'alerta-sonangol-1',
        EMP_TAAG,
      )
    })
  })

  describe('POST /api/v1/alertas', () => {
    it('rejeita dados inválidos', async () => {
      const response = await request(app)
        .post('/api/v1/alertas')
        .set('Authorization', `Bearer ${tokenClienteTaag}`)
        .send({
          equipamentoId: 'equipamento-invalido',
          descricao: 'abc',
          nivel: 'critico',
        })

      expect(response.status).toBe(400)

      expect(AlertaService.criar).not.toHaveBeenCalled()
    })

    it('cliente usa a empresa do token ao criar alerta', async () => {
      vi.mocked(AlertaService.criar).mockResolvedValue({
        id: 'alerta-novo',
        descricao: 'Temperatura acima do limite',
        nivel: 'critico',
        empresaId: EMP_TAAG,
        equipamentoId: EQUIP_TAAG,
      } as never)

      const response = await request(app)
        .post('/api/v1/alertas')
        .set('Authorization', `Bearer ${tokenClienteTaag}`)
        .send({
          equipamentoId: EQUIP_TAAG,
          descricao: 'Temperatura acima do limite',
          nivel: 'critico',
          empresaId: EMP_SONANGOL,
        })

      expect(response.status).toBe(201)

      expect(AlertaService.criar).toHaveBeenCalledWith(
        expect.objectContaining({
          equipamentoId: EQUIP_TAAG,
          descricao: 'Temperatura acima do limite',
          nivel: 'critico',
          empresaId: EMP_TAAG,
        }),
      )

      expect(AlertaService.criar).not.toHaveBeenCalledWith(
        expect.objectContaining({
          empresaId: EMP_SONANGOL,
        }),
      )
    })
  })

  describe('PATCH /api/v1/alertas/:id/ler', () => {
    it('marca alerta como lido usando o utilizador e empresa do token', async () => {
      vi.mocked(AlertaService.marcarComoLido).mockResolvedValue({
        id: 'alerta-taag-1',
        lidoPorId: 'usuario-taag',
        lidoEm: new Date(),
      } as never)

      const response = await request(app)
        .patch('/api/v1/alertas/alerta-taag-1/ler')
        .set('Authorization', `Bearer ${tokenClienteTaag}`)

      expect(response.status).toBe(200)

      expect(AlertaService.marcarComoLido).toHaveBeenCalledWith(
        'alerta-taag-1',
        'usuario-taag',
        EMP_TAAG,
      )
    })

    it('não permite marcar alerta de outra empresa como lido', async () => {
      vi.mocked(AlertaService.marcarComoLido).mockRejectedValue(
        new NotFoundError('Alerta não encontrado'),
      )

      const response = await request(app)
        .patch('/api/v1/alertas/alerta-sonangol-1/ler')
        .set('Authorization', `Bearer ${tokenClienteTaag}`)

      expect(response.status).toBe(404)

      expect(response.body).toEqual({
        success: false,
        message: 'Alerta não encontrado',
      })

      expect(AlertaService.marcarComoLido).toHaveBeenCalledWith(
        'alerta-sonangol-1',
        'usuario-taag',
        EMP_TAAG,
      )
    })
  })

  describe('DELETE /api/v1/alertas/:id', () => {
    it('impede cliente de remover alerta', async () => {
      const response = await request(app)
        .delete('/api/v1/alertas/alerta-taag-1')
        .set('Authorization', `Bearer ${tokenClienteTaag}`)

      expect(response.status).toBe(403)

      expect(response.body).toEqual({
        success: false,
        message: 'Acesso negado para este papel',
      })

      expect(AlertaService.remover).not.toHaveBeenCalled()
    })

    it('permite ADM remover alerta', async () => {
      vi.mocked(AlertaService.remover).mockResolvedValue(
        undefined as never,
      )

      const response = await request(app)
        .delete('/api/v1/alertas/alerta-taag-1')
        .set('Authorization', `Bearer ${tokenAdmin}`)

      expect(response.status).toBe(204)

      expect(AlertaService.remover).toHaveBeenCalledWith(
        'alerta-taag-1',
      )
    })

    it('permite Operacional remover alerta', async () => {
      vi.mocked(AlertaService.remover).mockResolvedValue(
        undefined as never,
      )

      const response = await request(app)
        .delete('/api/v1/alertas/alerta-taag-1')
        .set('Authorization', `Bearer ${tokenOperacional}`)

      expect(response.status).toBe(204)

      expect(AlertaService.remover).toHaveBeenCalledWith(
        'alerta-taag-1',
      )
    })
  })

  describe('GET /api/v1/alertas/resumo', () => {
    it('retorna resumo dos alertas da empresa do cliente', async () => {
      vi.mocked(AlertaService.resumo).mockResolvedValue({
        total: 3,
        naoLidos: 2,
        porNivel: {
          razoavel: 1,
          medio: 1,
          critico: 1,
        },
      })

      const response = await request(app)
        .get('/api/v1/alertas/resumo')
        .set('Authorization', `Bearer ${tokenClienteTaag}`)

      expect(response.status).toBe(200)

      expect(response.body.success).toBe(true)

      expect(AlertaService.resumo).toHaveBeenCalledWith(
        EMP_TAAG,
      )
    })
  })

  describe('GET /api/v1/alertas/nao-lidos', () => {
    it('retorna apenas os alertas não lidos da empresa do cliente', async () => {
      vi.mocked(AlertaService.naoLidosRecentes).mockResolvedValue([
        {
          id: 'alerta-taag-1',
          descricao: 'Temperatura acima do limite',
          nivel: 'critico',
          empresaId: EMP_TAAG,
          lidoEm: null,
        },
      ] as never)

      const response = await request(app)
        .get('/api/v1/alertas/nao-lidos')
        .set('Authorization', `Bearer ${tokenClienteTaag}`)

      expect(response.status).toBe(200)

      expect(response.body.success).toBe(true)

      expect(AlertaService.naoLidosRecentes).toHaveBeenCalledWith(
        EMP_TAAG,
      )
    })
  })
})

