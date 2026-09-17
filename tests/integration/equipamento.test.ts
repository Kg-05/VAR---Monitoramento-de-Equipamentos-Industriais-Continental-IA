import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import jwt from 'jsonwebtoken'

import { NotFoundError } from '../../src/shared/errors/AppError'
import { app } from '../../src/app'
import { EquipamentoService } from '../../src/modules/equipamento/equipamento.service'
import { Papel } from '../../src/shared/types/enums'

vi.mock('../../src/modules/equipamento/equipamento.service', () => ({
  EquipamentoService: {
    listar: vi.fn(),
    buscarPorId: vi.fn(),
    criar: vi.fn(),
    atualizar: vi.fn(),
    remover: vi.fn(),
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

describe('Equipamento - Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    process.env.JWT_SECRET = JWT_SECRET
  })

  describe('GET /api/v1/equipamentos', () => {
    it('rejeita requisição sem token', async () => {
      const response = await request(app)
        .get('/api/v1/equipamentos')

      expect(response.status).toBe(401)

      expect(response.body).toEqual({
        success: false,
        message: 'Token não fornecido',
      })

      expect(EquipamentoService.listar).not.toHaveBeenCalled()
    })

    it('rejeita token inválido', async () => {
      const response = await request(app)
        .get('/api/v1/equipamentos')
        .set('Authorization', 'Bearer token-invalido')

      expect(response.status).toBe(401)

      expect(response.body).toEqual({
        success: false,
        message: 'Token inválido ou expirado',
      })

      expect(EquipamentoService.listar).not.toHaveBeenCalled()
    })

    it('lista equipamentos para cliente autenticado', async () => {
      vi.mocked(EquipamentoService.listar).mockResolvedValue({
        data: [
          {
            id: 'equip-taag-1',
            nome: 'Turbina TF-12',
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
        .get('/api/v1/equipamentos')
        .set('Authorization', `Bearer ${tokenClienteTaag}`)

      expect(response.status).toBe(200)

      expect(response.body.success).toBe(true)

      expect(EquipamentoService.listar).toHaveBeenCalledWith(
        expect.objectContaining({
          empresaId: EMP_TAAG,
        }),
      )
    })

    it('força o empresaId do cliente mesmo quando outro empresaId é enviado na query', async () => {
      vi.mocked(EquipamentoService.listar).mockResolvedValue({
        data: [],
        meta: {
          total: 0,
          pagina: 1,
          limite: 10,
          totalPaginas: 0,
        },
      } as never)

      const response = await request(app)
        .get('/api/v1/equipamentos')
        .query({
          empresaId: EMP_SONANGOL,
        })
        .set('Authorization', `Bearer ${tokenClienteTaag}`)

      expect(response.status).toBe(200)

      expect(EquipamentoService.listar).toHaveBeenCalledWith(
        expect.objectContaining({
          empresaId: EMP_TAAG,
        }),
      )

      expect(EquipamentoService.listar).not.toHaveBeenCalledWith(
        expect.objectContaining({
          empresaId: EMP_SONANGOL,
        }),
      )
    })
  })

  describe('GET /api/v1/equipamentos/:id', () => {
    it('passa o empresaId do cliente para o serviço', async () => {
      const equipamento = {
        id: 'equip-taag-1',
        nome: 'Turbina TF-12',
        empresaId: EMP_TAAG,
      }

      vi.mocked(EquipamentoService.buscarPorId).mockResolvedValue(
        equipamento as never,
      )

      const response = await request(app)
        .get('/api/v1/equipamentos/equip-taag-1')
        .set('Authorization', `Bearer ${tokenClienteTaag}`)

      expect(response.status).toBe(200)

      expect(EquipamentoService.buscarPorId).toHaveBeenCalledWith(
        'equip-taag-1',
        EMP_TAAG,
      )
    })

    it('não permite ao cliente acessar equipamento de outra empresa', async () => {
      vi.mocked(EquipamentoService.buscarPorId).mockRejectedValue(
        new NotFoundError('Equipamento não encontrado'),
      )

      const response = await request(app)
        .get('/api/v1/equipamentos/equip-sonangol-1')
        .set('Authorization', `Bearer ${tokenClienteTaag}`)

      expect(response.status).toBe(404)

      expect(response.body).toEqual({
        success: false,
        message: 'Equipamento não encontrado',
      })

      expect(EquipamentoService.buscarPorId).toHaveBeenCalledWith(
        'equip-sonangol-1',
        EMP_TAAG,
      )
    })
  })

  describe('POST /api/v1/equipamentos', () => {
    it('rejeita dados inválidos', async () => {
      const response = await request(app)
        .post('/api/v1/equipamentos')
        .set('Authorization', `Bearer ${tokenClienteTaag}`)
        .send({
          nome: 'X',
          modelo: '',
          localizacao: '',
        })

      expect(response.status).toBe(400)

      expect(EquipamentoService.criar).not.toHaveBeenCalled()
    })

    it('cliente usa a empresa do token ao criar equipamento', async () => {
      vi.mocked(EquipamentoService.criar).mockResolvedValue({
        id: 'equip-novo',
        nome: 'Nova Turbina',
        modelo: 'NT-01',
        localizacao: 'Linha 1',
        empresaId: EMP_TAAG,
      } as never)

      const response = await request(app)
        .post('/api/v1/equipamentos')
        .set('Authorization', `Bearer ${tokenClienteTaag}`)
        .send({
          nome: 'Nova Turbina',
          modelo: 'NT-01',
          localizacao: 'Linha 1',
          empresaId: EMP_SONANGOL,
        })

      expect(response.status).toBe(201)

      expect(EquipamentoService.criar).toHaveBeenCalledWith(
        expect.objectContaining({
          empresaId: EMP_TAAG,
        }),
      )

      expect(EquipamentoService.criar).not.toHaveBeenCalledWith(
        expect.objectContaining({
          empresaId: EMP_SONANGOL,
        }),
      )
    })
  })

  describe('DELETE /api/v1/equipamentos/:id', () => {
    it('impede cliente de remover equipamento', async () => {
      const response = await request(app)
        .delete('/api/v1/equipamentos/equip-taag-1')
        .set('Authorization', `Bearer ${tokenClienteTaag}`)

      expect(response.status).toBe(403)

      expect(response.body).toEqual({
        success: false,
        message: 'Acesso negado para este papel',
      })

      expect(EquipamentoService.remover).not.toHaveBeenCalled()
    })

    it('permite ADM remover equipamento', async () => {
      vi.mocked(EquipamentoService.remover).mockResolvedValue(
        undefined as never,
      )

      const response = await request(app)
        .delete('/api/v1/equipamentos/equip-taag-1')
        .set('Authorization', `Bearer ${tokenAdmin}`)

      expect(response.status).toBe(204)

      expect(EquipamentoService.remover).toHaveBeenCalledWith(
        'equip-taag-1',
      )
    })
  })

  describe('Token', () => {
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
        .get('/api/v1/equipamentos')
        .set('Authorization', `Bearer ${token}`)

      expect(response.status).toBe(401)

      expect(response.body).toEqual({
        success: false,
        message: 'Token inválido',
      })

      expect(EquipamentoService.listar).not.toHaveBeenCalled()
    })
  })
})
