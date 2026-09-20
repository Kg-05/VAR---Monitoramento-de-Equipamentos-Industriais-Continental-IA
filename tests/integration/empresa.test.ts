import request from 'supertest'
import jwt from 'jsonwebtoken'
import { describe, it, expect, beforeEach, vi } from 'vitest'

import { app } from '../../src/app'
import { EmpresaService } from '../../src/modules/empresa/empresa.service'
import { NotFoundError } from '../../src/shared/errors/AppError'

process.env.JWT_SECRET = 'segredo-de-teste'

const JWT_SECRET = 'segredo-de-teste'

const EMPRESA_ID = '11111111-1111-4111-8111-111111111111'

function gerarToken(
  papel: 'ADM' | 'Operacional' | 'Cliente',
  empresaId: string | null = null,
) {
  return jwt.sign(
    {
      id: 'usuario-teste',
      papel,
      empresaId,
    },
    JWT_SECRET,
  )
}

describe('Empresa - Integration', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe('Autenticação', () => {
    it('deve rejeitar acesso sem token', async () => {
      const response = await request(app)
        .get('/api/v1/empresas')

      expect(response.status).toBe(401)
      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Token não fornecido')
    })

    it('deve rejeitar token inválido', async () => {
      const response = await request(app)
        .get('/api/v1/empresas')
        .set('Authorization', 'Bearer token-invalido')

      expect(response.status).toBe(401)
      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Token inválido ou expirado')
    })
  })

  describe('Autorização por papel', () => {
    it('deve bloquear Cliente', async () => {
      const token = gerarToken('Cliente', EMPRESA_ID)

      const response = await request(app)
        .get('/api/v1/empresas')
        .set('Authorization', `Bearer ${token}`)

      expect(response.status).toBe(403)
      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Acesso negado para este papel')
    })

    it('deve permitir ADM', async () => {
      vi.spyOn(EmpresaService, 'listar').mockResolvedValue({
        data: [],
        meta: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        },
      } as any)

      const token = gerarToken('ADM')

      const response = await request(app)
        .get('/api/v1/empresas')
        .set('Authorization', `Bearer ${token}`)

      expect(response.status).toBe(200)
      expect(EmpresaService.listar).toHaveBeenCalled()
    })

    it('deve permitir Operacional', async () => {
      vi.spyOn(EmpresaService, 'listar').mockResolvedValue({
        data: [],
        meta: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        },
      } as any)

      const token = gerarToken('Operacional')

      const response = await request(app)
        .get('/api/v1/empresas')
        .set('Authorization', `Bearer ${token}`)

      expect(response.status).toBe(200)
      expect(EmpresaService.listar).toHaveBeenCalled()
    })
  })

  describe('GET /empresas', () => {
    it('deve listar empresas', async () => {
      vi.spyOn(EmpresaService, 'listar').mockResolvedValue({
        data: [
          {
            id: EMPRESA_ID,
            nome: 'Empresa Teste',
          },
        ],
        meta: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      } as any)

      const token = gerarToken('ADM')

      const response = await request(app)
        .get('/api/v1/empresas')
        .set('Authorization', `Bearer ${token}`)

      expect(response.status).toBe(200)
      expect(response.body).toBeDefined()
      expect(EmpresaService.listar).toHaveBeenCalled()
    })
  })

  describe('GET /empresas/:id', () => {
    it('deve buscar uma empresa pelo ID', async () => {
      vi.spyOn(EmpresaService, 'buscarPorId').mockResolvedValue({
        id: EMPRESA_ID,
        nome: 'Empresa Teste',
      } as any)

      const token = gerarToken('ADM')

      const response = await request(app)
        .get(`/api/v1/empresas/${EMPRESA_ID}`)
        .set('Authorization', `Bearer ${token}`)

      expect(response.status).toBe(200)
      expect(EmpresaService.buscarPorId).toHaveBeenCalledWith(EMPRESA_ID, undefined)
    })

    it('deve permitir que um Cliente veja os dados da própria empresa', async () => {
      vi.spyOn(EmpresaService, 'buscarPorId').mockResolvedValue({
        id: EMPRESA_ID,
        nome: 'Empresa Teste',
      } as any)

      const token = gerarToken('Cliente', EMPRESA_ID)

      const response = await request(app)
        .get(`/api/v1/empresas/${EMPRESA_ID}`)
        .set('Authorization', `Bearer ${token}`)

      expect(response.status).toBe(200)
      expect(EmpresaService.buscarPorId).toHaveBeenCalledWith(EMPRESA_ID, EMPRESA_ID)
    })

    it('não deve permitir que um Cliente veja outra empresa', async () => {
      vi.spyOn(EmpresaService, 'buscarPorId').mockRejectedValue(
        new NotFoundError('Empresa não encontrada'),
      )

      const outraEmpresaId = '22222222-2222-4222-8222-222222222222'
      const token = gerarToken('Cliente', EMPRESA_ID)

      const response = await request(app)
        .get(`/api/v1/empresas/${outraEmpresaId}`)
        .set('Authorization', `Bearer ${token}`)

      expect(response.status).toBe(404)
      expect(EmpresaService.buscarPorId).toHaveBeenCalledWith(outraEmpresaId, EMPRESA_ID)
    })
  })

  describe('POST /empresas', () => {
    it('deve criar uma empresa', async () => {
      vi.spyOn(EmpresaService, 'criar').mockResolvedValue({
        id: EMPRESA_ID,
        nome: 'Empresa Nova',
        cnpj: '5417105938',
        email: 'empresa@teste.com',
      } as any)

      const token = gerarToken('ADM')

      const response = await request(app)
        .post('/api/v1/empresas')
        .set('Authorization', `Bearer ${token}`)
        .send({
          nome: 'Empresa Nova',
          cnpj: '5417105938',
          email: 'empresa@teste.com',
          telefone: '923000000',
        })

      expect(response.status).toBe(201)
      expect(EmpresaService.criar).toHaveBeenCalledWith({
        nome: 'Empresa Nova',
        cnpj: '5417105938',
        email: 'empresa@teste.com',
        telefone: '923000000',
      })
    })

    it('deve rejeitar dados inválidos', async () => {
      const criarSpy = vi.spyOn(EmpresaService, 'criar')

      const token = gerarToken('ADM')

      const response = await request(app)
        .post('/api/v1/empresas')
        .set('Authorization', `Bearer ${token}`)
        .send({
          nome: 'A',
          cnpj: '123',
          email: 'email-invalido',
        })

      expect(response.status).toBe(400)
      expect(criarSpy).not.toHaveBeenCalled()
    })

    it('deve bloquear Cliente ao tentar criar empresa', async () => {
      const criarSpy = vi.spyOn(EmpresaService, 'criar')

      const token = gerarToken('Cliente', EMPRESA_ID)

      const response = await request(app)
        .post('/api/v1/empresas')
        .set('Authorization', `Bearer ${token}`)
        .send({
          nome: 'Empresa Nova',
          cnpj: '12345678000199',
          email: 'empresa@teste.com',
        })

      expect(response.status).toBe(403)
      expect(criarSpy).not.toHaveBeenCalled()
    })
  })

  describe('PATCH /empresas/:id', () => {
    it('deve atualizar uma empresa', async () => {
      vi.spyOn(EmpresaService, 'atualizar').mockResolvedValue({
        id: EMPRESA_ID,
        nome: 'Empresa Atualizada',
      } as any)

      const token = gerarToken('ADM')

      const response = await request(app)
        .patch(`/api/v1/empresas/${EMPRESA_ID}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          nome: 'Empresa Atualizada',
          email: 'atualizada@teste.com',
        })

      expect(response.status).toBe(200)
      expect(EmpresaService.atualizar).toHaveBeenCalledWith(
        EMPRESA_ID,
        {
          nome: 'Empresa Atualizada',
          email: 'atualizada@teste.com',
        },
      )
    })

    it('deve rejeitar atualização inválida', async () => {
      const atualizarSpy = vi.spyOn(EmpresaService, 'atualizar')

      const token = gerarToken('ADM')

      const response = await request(app)
        .patch(`/api/v1/empresas/${EMPRESA_ID}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          email: 'email-invalido',
        })

      expect(response.status).toBe(400)
      expect(atualizarSpy).not.toHaveBeenCalled()
    })
  })

  describe('PATCH /empresas/:id/ativar', () => {
    it('deve ativar uma empresa', async () => {
      vi.spyOn(EmpresaService, 'ativar').mockResolvedValue({
        id: EMPRESA_ID,
        status: 'Ativo',
      } as any)

      const token = gerarToken('ADM')

      const response = await request(app)
        .patch(`/api/v1/empresas/${EMPRESA_ID}/ativar`)
        .set('Authorization', `Bearer ${token}`)

      expect(response.status).toBe(200)
      expect(EmpresaService.ativar).toHaveBeenCalledWith(EMPRESA_ID)
    })
  })

  describe('DELETE /empresas/:id', () => {
    it('deve desativar uma empresa', async () => {
      vi.spyOn(EmpresaService, 'desativar').mockResolvedValue({
        id: EMPRESA_ID,
        status: 'Inativo',
      } as any)

      const token = gerarToken('Operacional')

      const response = await request(app)
        .delete(`/api/v1/empresas/${EMPRESA_ID}`)
        .set('Authorization', `Bearer ${token}`)

      expect(response.status).toBe(204)
      expect(EmpresaService.desativar).toHaveBeenCalledWith(EMPRESA_ID)
    })

    it('deve bloquear Cliente', async () => {
      const desativarSpy = vi.spyOn(EmpresaService, 'desativar')

      const token = gerarToken('Cliente', EMPRESA_ID)

      const response = await request(app)
        .delete(`/api/v1/empresas/${EMPRESA_ID}`)
        .set('Authorization', `Bearer ${token}`)

      expect(response.status).toBe(403)
      expect(desativarSpy).not.toHaveBeenCalled()
    })
  })

  describe('GET /empresas/dashboard/resumo', () => {
    it('deve retornar o resumo do dashboard', async () => {
      vi.spyOn(EmpresaService, 'resumoDashboard').mockResolvedValue({
        cards: {
          totalEmpresas: 3,
          empresasAtivas: 2,
          empresasInativas: 1,
          empresasSuspensas: 1,
        },
        alertas: {
          total: 10,
          naoLidos: 4,
          porNivel: {
            razoavel: 3,
            medio: 4,
            critico: 3,
          },
        },
        tabela: [],
      })

      const token = gerarToken('ADM')

      const response = await request(app)
        .get('/api/v1/empresas/dashboard/resumo')
        .set('Authorization', `Bearer ${token}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(EmpresaService.resumoDashboard).toHaveBeenCalled()
    })
  })
})