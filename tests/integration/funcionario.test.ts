import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import jwt from 'jsonwebtoken'

import { NotFoundError, ConflictError } from '../../src/shared/errors/AppError'
import { app } from '../../src/app'
import { FuncionarioService } from '../../src/modules/funcionario/funcionario.service'
import { Papel } from '../../src/shared/types/enums'

vi.mock('../../src/modules/funcionario/funcionario.service', () => ({
  FuncionarioService: {
    listar: vi.fn(),
    buscarPorId: vi.fn(),
    criar: vi.fn(),
    atualizar: vi.fn(),
    desativar: vi.fn(),
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

describe('Funcionário - Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.JWT_SECRET = JWT_SECRET
  })

  describe('Autenticação', () => {
    it('rejeita requisição sem token', async () => {
      const response = await request(app).get('/api/v1/funcionarios')

      expect(response.status).toBe(401)
      expect(response.body).toEqual({
        success: false,
        message: 'Token não fornecido',
      })
      expect(FuncionarioService.listar).not.toHaveBeenCalled()
    })

    it('rejeita token inválido', async () => {
      const response = await request(app)
        .get('/api/v1/funcionarios')
        .set('Authorization', 'Bearer token-invalido')

      expect(response.status).toBe(401)
      expect(response.body).toEqual({
        success: false,
        message: 'Token inválido ou expirado',
      })
      expect(FuncionarioService.listar).not.toHaveBeenCalled()
    })
  })

  describe('GET /api/v1/funcionarios', () => {
    it('lista funcionários restrito à empresa do cliente', async () => {
      vi.mocked(FuncionarioService.listar).mockResolvedValue({
        data: [{ id: 'func-taag-1', nome: 'Ana', empresaId: EMP_TAAG }],
        meta: { total: 1, pagina: 1, limite: 10, totalPaginas: 1 },
      } as never)

      const response = await request(app)
        .get('/api/v1/funcionarios')
        .set('Authorization', `Bearer ${tokenClienteTaag}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(FuncionarioService.listar).toHaveBeenCalledWith(
        expect.objectContaining({ empresaId: EMP_TAAG }),
      )
    })

    it('impõe o empresaId do cliente quando outro empresaId é enviado na query', async () => {
      vi.mocked(FuncionarioService.listar).mockResolvedValue({
        data: [],
        meta: { total: 0, pagina: 1, limite: 10, totalPaginas: 0 },
      } as never)

      const response = await request(app)
        .get('/api/v1/funcionarios')
        .query({ empresaId: EMP_SONANGOL })
        .set('Authorization', `Bearer ${tokenClienteTaag}`)

      expect(response.status).toBe(200)
      expect(FuncionarioService.listar).toHaveBeenCalledWith(
        expect.objectContaining({ empresaId: EMP_TAAG }),
      )
      expect(FuncionarioService.listar).not.toHaveBeenCalledWith(
        expect.objectContaining({ empresaId: EMP_SONANGOL }),
      )
    })
  })

  describe('GET /api/v1/funcionarios/:id', () => {
    it('passa o empresaId do cliente para o serviço', async () => {
      vi.mocked(FuncionarioService.buscarPorId).mockResolvedValue({
        id: 'func-taag-1',
        nome: 'Ana',
        empresaId: EMP_TAAG,
      } as never)

      const response = await request(app)
        .get('/api/v1/funcionarios/func-taag-1')
        .set('Authorization', `Bearer ${tokenClienteTaag}`)

      expect(response.status).toBe(200)
      expect(FuncionarioService.buscarPorId).toHaveBeenCalledWith('func-taag-1', EMP_TAAG)
    })

    it('não permite ao cliente acessar funcionário de outra empresa', async () => {
      vi.mocked(FuncionarioService.buscarPorId).mockRejectedValue(
        new NotFoundError('Funcionário não encontrado'),
      )

      const response = await request(app)
        .get('/api/v1/funcionarios/func-sonangol-1')
        .set('Authorization', `Bearer ${tokenClienteTaag}`)

      expect(response.status).toBe(404)
      expect(response.body).toEqual({
        success: false,
        message: 'Funcionário não encontrado',
      })
    })
  })

  describe('POST /api/v1/funcionarios', () => {
    it('rejeita dados inválidos', async () => {
      const response = await request(app)
        .post('/api/v1/funcionarios')
        .set('Authorization', `Bearer ${tokenClienteTaag}`)
        .send({ nome: 'A', email: 'invalido', cargo: '' })

      expect(response.status).toBe(400)
      expect(FuncionarioService.criar).not.toHaveBeenCalled()
    })

    it('cliente usa a empresa do token ao criar funcionário', async () => {
      vi.mocked(FuncionarioService.criar).mockResolvedValue({
        id: 'func-novo',
        nome: 'Ana',
        email: 'ana@empresa.ao',
        cargo: 'Operadora',
        empresaId: EMP_TAAG,
      } as never)

      const response = await request(app)
        .post('/api/v1/funcionarios')
        .set('Authorization', `Bearer ${tokenClienteTaag}`)
        .send({
          nome: 'Ana',
          email: 'ana@empresa.ao',
          cargo: 'Operadora',
          empresaId: EMP_SONANGOL,
        })

      expect(response.status).toBe(201)
      expect(FuncionarioService.criar).toHaveBeenCalledWith(
        expect.objectContaining({
          nome: 'Ana',
          email: 'ana@empresa.ao',
          cargo: 'Operadora',
          empresaId: EMP_TAAG,
        }),
      )
      expect(FuncionarioService.criar).not.toHaveBeenCalledWith(
        expect.objectContaining({ empresaId: EMP_SONANGOL }),
      )
    })

    it('propaga conflito quando email já existe na empresa', async () => {
      vi.mocked(FuncionarioService.criar).mockRejectedValue(
        new ConflictError('Email já cadastrado nesta empresa'),
      )

      const response = await request(app)
        .post('/api/v1/funcionarios')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          nome: 'Ana',
          email: 'ana@empresa.ao',
          cargo: 'Operadora',
          empresaId: EMP_TAAG,
        })

      expect(response.status).toBe(409)
      expect(response.body).toEqual({
        success: false,
        message: 'Email já cadastrado nesta empresa',
      })
    })
  })

  describe('PATCH /api/v1/funcionarios/:id', () => {
    it('atualiza funcionário respeitando o escopo da empresa', async () => {
      vi.mocked(FuncionarioService.atualizar).mockResolvedValue({
        id: 'func-taag-1',
        nome: 'Ana Maria',
      } as never)

      const response = await request(app)
        .patch('/api/v1/funcionarios/func-taag-1')
        .set('Authorization', `Bearer ${tokenClienteTaag}`)
        .send({ nome: 'Ana Maria' })

      expect(response.status).toBe(200)
      expect(FuncionarioService.atualizar).toHaveBeenCalledWith(
        'func-taag-1',
        expect.objectContaining({ nome: 'Ana Maria' }),
        EMP_TAAG,
      )
    })

    it('rejeita atualização com dados inválidos', async () => {
      const response = await request(app)
        .patch('/api/v1/funcionarios/func-taag-1')
        .set('Authorization', `Bearer ${tokenClienteTaag}`)
        .send({ email: 'invalido' })

      expect(response.status).toBe(400)
      expect(FuncionarioService.atualizar).not.toHaveBeenCalled()
    })
  })

  describe('DELETE /api/v1/funcionarios/:id', () => {
    it('permite ao cliente desativar um funcionário da própria empresa', async () => {
      vi.mocked(FuncionarioService.desativar).mockResolvedValue(undefined as never)

      const response = await request(app)
        .delete('/api/v1/funcionarios/func-taag-1')
        .set('Authorization', `Bearer ${tokenClienteTaag}`)

      expect(response.status).toBe(204)
      expect(FuncionarioService.desativar).toHaveBeenCalledWith('func-taag-1', EMP_TAAG)
    })

    it('não permite ao cliente desativar funcionário de outra empresa', async () => {
      vi.mocked(FuncionarioService.desativar).mockRejectedValue(
        new NotFoundError('Funcionário não encontrado'),
      )

      const response = await request(app)
        .delete('/api/v1/funcionarios/func-sonangol-1')
        .set('Authorization', `Bearer ${tokenClienteTaag}`)

      expect(response.status).toBe(404)
      expect(FuncionarioService.desativar).toHaveBeenCalledWith('func-sonangol-1', EMP_TAAG)
    })

    it('permite ADM desativar funcionário', async () => {
      vi.mocked(FuncionarioService.desativar).mockResolvedValue(undefined as never)

      const response = await request(app)
        .delete('/api/v1/funcionarios/func-taag-1')
        .set('Authorization', `Bearer ${tokenAdmin}`)

      expect(response.status).toBe(204)
      expect(FuncionarioService.desativar).toHaveBeenCalledWith('func-taag-1', undefined)
    })

    it('permite Operacional desativar funcionário', async () => {
      vi.mocked(FuncionarioService.desativar).mockResolvedValue(undefined as never)

      const response = await request(app)
        .delete('/api/v1/funcionarios/func-taag-1')
        .set('Authorization', `Bearer ${tokenOperacional}`)

      expect(response.status).toBe(204)
      expect(FuncionarioService.desativar).toHaveBeenCalledWith('func-taag-1', undefined)
    })
  })
})
