import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import jwt from 'jsonwebtoken'

import { app } from '../../src/app'
import { RelatorioService } from '../../src/modules/relatorio/relatorio.service'
import { Papel } from '../../src/shared/types/enums'

vi.mock('../../src/modules/relatorio/relatorio.service', () => ({
  RelatorioService: {
    alertas: vi.fn(),
    financeiro: vi.fn(),
    licencas: vi.fn(),
    equipamentos: vi.fn(),
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

describe('Relatório - Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.JWT_SECRET = JWT_SECRET
  })

  describe('Autenticação', () => {
    it('rejeita requisição sem token', async () => {
      const response = await request(app).get('/api/v1/relatorios/financeiro')

      expect(response.status).toBe(401)
      expect(response.body).toEqual({
        success: false,
        message: 'Token não fornecido',
      })
      expect(RelatorioService.financeiro).not.toHaveBeenCalled()
    })

    it('rejeita token inválido', async () => {
      const response = await request(app)
        .get('/api/v1/relatorios/financeiro')
        .set('Authorization', 'Bearer token-invalido')

      expect(response.status).toBe(401)
      expect(response.body).toEqual({
        success: false,
        message: 'Token inválido ou expirado',
      })
      expect(RelatorioService.financeiro).not.toHaveBeenCalled()
    })
  })

  describe('Autorização por papel', () => {
    it('bloqueia Cliente no relatório financeiro', async () => {
      const response = await request(app)
        .get('/api/v1/relatorios/financeiro')
        .set('Authorization', `Bearer ${tokenCliente}`)

      expect(response.status).toBe(403)
      expect(response.body).toEqual({
        success: false,
        message: 'Acesso negado para este papel',
      })
      expect(RelatorioService.financeiro).not.toHaveBeenCalled()
    })

    it('bloqueia Cliente no relatório de licenças', async () => {
      const response = await request(app)
        .get('/api/v1/relatorios/licencas')
        .set('Authorization', `Bearer ${tokenCliente}`)

      expect(response.status).toBe(403)
      expect(RelatorioService.licencas).not.toHaveBeenCalled()
    })

    it('permite ADM', async () => {
      vi.mocked(RelatorioService.financeiro).mockResolvedValue({
        receitaTotal: 0,
        porStatus: [],
        topEmpresas: [],
      })

      const response = await request(app)
        .get('/api/v1/relatorios/financeiro')
        .set('Authorization', `Bearer ${tokenAdmin}`)

      expect(response.status).toBe(200)
      expect(RelatorioService.financeiro).toHaveBeenCalled()
    })

    it('permite Operacional', async () => {
      vi.mocked(RelatorioService.equipamentos).mockResolvedValue({
        total: 0,
        porStatus: [],
        comMaisAlertas: [],
      })

      const response = await request(app)
        .get('/api/v1/relatorios/equipamentos')
        .set('Authorization', `Bearer ${tokenOperacional}`)

      expect(response.status).toBe(200)
      expect(RelatorioService.equipamentos).toHaveBeenCalled()
    })
  })

  describe('GET /api/v1/relatorios/alertas', () => {
    it('gera o relatório aplicando os filtros da query', async () => {
      vi.mocked(RelatorioService.alertas).mockResolvedValue({
        total: 10,
        naoLidos: 4,
        taxaLeitura: 60,
        porNivel: [],
        topEquipamentos: [],
      })

      const response = await request(app)
        .get('/api/v1/relatorios/alertas')
        .query({ empresaId: 'emp-1', dataInicio: '2026-01-01', dataFim: '2026-12-31' })
        .set('Authorization', `Bearer ${tokenAdmin}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(RelatorioService.alertas).toHaveBeenCalledWith(
        expect.objectContaining({ empresaId: 'emp-1' }),
      )
    })
  })
})
