import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import jwt from 'jsonwebtoken'

import { ConflictError, ForbiddenError } from '../../src/shared/errors/AppError'
import { app } from '../../src/app'
import { UsuarioService } from '../../src/modules/usuario/usuario.service'
import { Papel } from '../../src/shared/types/enums'

vi.mock('../../src/modules/usuario/usuario.service', () => ({
  UsuarioService: {
    listar: vi.fn(),
    buscarPorId: vi.fn(),
    criar: vi.fn(),
    atualizar: vi.fn(),
    desativar: vi.fn(),
  },
}))

const JWT_SECRET = 'segredo-de-teste'
const USR_ID = '55555555-5555-4555-8555-555555555555'

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

describe('Usuário - Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.JWT_SECRET = JWT_SECRET
  })

  describe('Autenticação', () => {
    it('rejeita requisição sem token', async () => {
      const response = await request(app).get('/api/v1/usuarios')

      expect(response.status).toBe(401)
      expect(response.body).toEqual({
        success: false,
        message: 'Token não fornecido',
      })
      expect(UsuarioService.listar).not.toHaveBeenCalled()
    })

    it('rejeita token inválido', async () => {
      const response = await request(app)
        .get('/api/v1/usuarios')
        .set('Authorization', 'Bearer token-invalido')

      expect(response.status).toBe(401)
      expect(response.body).toEqual({
        success: false,
        message: 'Token inválido ou expirado',
      })
      expect(UsuarioService.listar).not.toHaveBeenCalled()
    })
  })

  describe('Autorização por papel', () => {
    it('bloqueia Cliente em todas as rotas de usuários', async () => {
      const response = await request(app)
        .get('/api/v1/usuarios')
        .set('Authorization', `Bearer ${tokenCliente}`)

      expect(response.status).toBe(403)
      expect(response.body).toEqual({
        success: false,
        message: 'Acesso negado para este papel',
      })
      expect(UsuarioService.listar).not.toHaveBeenCalled()
    })

    it('permite ADM', async () => {
      vi.mocked(UsuarioService.listar).mockResolvedValue({
        data: [],
        meta: { total: 0, pagina: 1, limite: 10, totalPaginas: 0 },
      } as never)

      const response = await request(app)
        .get('/api/v1/usuarios')
        .set('Authorization', `Bearer ${tokenAdmin}`)

      expect(response.status).toBe(200)
      expect(UsuarioService.listar).toHaveBeenCalled()
    })

    it('permite Operacional', async () => {
      vi.mocked(UsuarioService.listar).mockResolvedValue({
        data: [],
        meta: { total: 0, pagina: 1, limite: 10, totalPaginas: 0 },
      } as never)

      const response = await request(app)
        .get('/api/v1/usuarios')
        .set('Authorization', `Bearer ${tokenOperacional}`)

      expect(response.status).toBe(200)
      expect(UsuarioService.listar).toHaveBeenCalled()
    })
  })

  describe('POST /api/v1/usuarios', () => {
    it('rejeita dados inválidos', async () => {
      const response = await request(app)
        .post('/api/v1/usuarios')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ email: 'invalido', nome: 'A', senha: '123', papel: 'ADM' })

      expect(response.status).toBe(400)
      expect(UsuarioService.criar).not.toHaveBeenCalled()
    })

    it('ADM cria usuário com qualquer papel', async () => {
      vi.mocked(UsuarioService.criar).mockResolvedValue({
        id: USR_ID,
        email: 'novo@empresa.ao',
        papel: 'Operacional',
      } as never)

      const response = await request(app)
        .post('/api/v1/usuarios')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ email: 'novo@empresa.ao', nome: 'Novo', senha: '123456', papel: 'Operacional' })

      expect(response.status).toBe(201)
      expect(UsuarioService.criar).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'novo@empresa.ao', papel: 'Operacional' }),
        Papel.ADM,
      )
    })

    it('propaga bloqueio quando Operacional tenta criar usuário que não seja Cliente', async () => {
      vi.mocked(UsuarioService.criar).mockRejectedValue(
        new ForbiddenError('Operacional só pode criar usuários do tipo Cliente'),
      )

      const response = await request(app)
        .post('/api/v1/usuarios')
        .set('Authorization', `Bearer ${tokenOperacional}`)
        .send({ email: 'novo@empresa.ao', nome: 'Novo', senha: '123456', papel: 'ADM' })

      expect(response.status).toBe(403)
      expect(response.body).toEqual({
        success: false,
        message: 'Operacional só pode criar usuários do tipo Cliente',
      })
      expect(UsuarioService.criar).toHaveBeenCalledWith(
        expect.objectContaining({ papel: 'ADM' }),
        Papel.Operacional,
      )
    })

    it('propaga conflito de email duplicado', async () => {
      vi.mocked(UsuarioService.criar).mockRejectedValue(
        new ConflictError('Email já cadastrado'),
      )

      const response = await request(app)
        .post('/api/v1/usuarios')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ email: 'existente@empresa.ao', nome: 'Novo', senha: '123456', papel: 'Cliente', empresaId: '11111111-1111-4111-8111-111111111111' })

      expect(response.status).toBe(409)
      expect(response.body).toEqual({
        success: false,
        message: 'Email já cadastrado',
      })
    })
  })

  describe('PATCH /api/v1/usuarios/:id', () => {
    it('rejeita atualização com dados inválidos', async () => {
      const response = await request(app)
        .patch(`/api/v1/usuarios/${USR_ID}`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ email: 'invalido' })

      expect(response.status).toBe(400)
      expect(UsuarioService.atualizar).not.toHaveBeenCalled()
    })

    it('atualiza usuário', async () => {
      vi.mocked(UsuarioService.atualizar).mockResolvedValue({
        id: USR_ID,
        nome: 'Atualizado',
      } as never)

      const response = await request(app)
        .patch(`/api/v1/usuarios/${USR_ID}`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ nome: 'Atualizado' })

      expect(response.status).toBe(200)
      expect(UsuarioService.atualizar).toHaveBeenCalledWith(
        USR_ID,
        expect.objectContaining({ nome: 'Atualizado' }),
      )
    })
  })

  describe('DELETE /api/v1/usuarios/:id', () => {
    it('impede Cliente de desativar usuário', async () => {
      const response = await request(app)
        .delete(`/api/v1/usuarios/${USR_ID}`)
        .set('Authorization', `Bearer ${tokenCliente}`)

      expect(response.status).toBe(403)
      expect(UsuarioService.desativar).not.toHaveBeenCalled()
    })

    it('permite ADM desativar usuário', async () => {
      vi.mocked(UsuarioService.desativar).mockResolvedValue(undefined as never)

      const response = await request(app)
        .delete(`/api/v1/usuarios/${USR_ID}`)
        .set('Authorization', `Bearer ${tokenAdmin}`)

      expect(response.status).toBe(204)
      expect(UsuarioService.desativar).toHaveBeenCalledWith(USR_ID)
    })
  })
})
