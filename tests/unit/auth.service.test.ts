
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import jwt from 'jsonwebtoken'
import { Papel } from '@prisma/client'

// Mock do Prisma
vi.mock('@/shared/database/prisma.client', () => ({
  prisma: {
    usuario: {
      findUnique: vi.fn(),
    },
    sessaoAtiva: {
      create: vi.fn(),
    },
  },
}))

// Mock das funções de senha
vi.mock('@/shared/utils/hashSenha', () => ({
  verificarSenha: vi.fn(),
}))

import { prisma } from '../../src/shared/database/prisma.client'
import { verificarSenha } from '../../src/shared/utils/hashSenha'
import { AuthService } from '../../src/modules/auth/auth.service'
import { UnauthorizedError } from '../../src/shared/errors/AppError'

const mockUsuario = {
  id: 'usuario-uuid-001',
  nome: 'Carlos Mendes',
  email: 'gestor@sonangol-refinaria.ao',
  senhaHash: 'hash-da-senha',
  papel: Papel.Cliente,
  empresaId: 'empresa-uuid-001',
  status: 'Ativo',
}

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    process.env.JWT_SECRET = 'segredo-de-teste'
    process.env.JWT_EXPIRES_IN = '7d'
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('login', () => {
    it('realiza login com credenciais válidas', async () => {
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUsuario as never)
      vi.mocked(verificarSenha).mockResolvedValue(true)

      const resultado = await AuthService.login({
        email: 'gestor@sonangol-refinaria.ao',
        senha: 'Cliente@123',
      })

      expect(resultado.token).toBeDefined()
      expect(typeof resultado.token).toBe('string')

      expect(resultado.usuario).toEqual({
        id: mockUsuario.id,
        nome: mockUsuario.nome,
        email: mockUsuario.email,
        papel: mockUsuario.papel,
        empresaId: mockUsuario.empresaId,
      })
    })

    it('procura o usuário pelo email informado', async () => {
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUsuario as never)
      vi.mocked(verificarSenha).mockResolvedValue(true)

      await AuthService.login({
        email: mockUsuario.email,
        senha: 'Cliente@123',
      })

      expect(prisma.usuario.findUnique).toHaveBeenCalledWith({
        where: {
          email: mockUsuario.email,
        },
      })
    })

    it('lança UnauthorizedError quando o usuário não existe', async () => {
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue(null)

      await expect(
        AuthService.login({
          email: 'inexistente@sistema.ao',
          senha: 'Senha@123',
        })
      ).rejects.toThrow(UnauthorizedError)

      expect(verificarSenha).not.toHaveBeenCalled()
    })

    it('lança UnauthorizedError quando o usuário está inativo', async () => {
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue({
        ...mockUsuario,
        status: 'Inativo',
      } as never)

      await expect(
        AuthService.login({
          email: mockUsuario.email,
          senha: 'Cliente@123',
        })
      ).rejects.toThrow(UnauthorizedError)

      expect(verificarSenha).not.toHaveBeenCalled()
    })

    it('lança UnauthorizedError quando a senha está incorreta', async () => {
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUsuario as never)
      vi.mocked(verificarSenha).mockResolvedValue(false)

      await expect(
        AuthService.login({
          email: mockUsuario.email,
          senha: 'SenhaErrada',
        })
      ).rejects.toThrow(UnauthorizedError)
    })

    it('não expõe a senhaHash na resposta', async () => {
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUsuario as never)
      vi.mocked(verificarSenha).mockResolvedValue(true)

      const resultado = await AuthService.login({
        email: mockUsuario.email,
        senha: 'Cliente@123',
      })

      expect(resultado.usuario).not.toHaveProperty('senhaHash')
      expect(resultado.usuario).not.toHaveProperty('senha')
    })

    it('gera JWT com id, papel e empresaId corretos', async () => {
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUsuario as never)
      vi.mocked(verificarSenha).mockResolvedValue(true)

      const resultado = await AuthService.login({
        email: mockUsuario.email,
        senha: 'Cliente@123',
      })

      const payload = jwt.verify(
        resultado.token,
        process.env.JWT_SECRET!
      ) as jwt.JwtPayload

      expect(payload.id).toBe(mockUsuario.id)
      expect(payload.papel).toBe(mockUsuario.papel)
      expect(payload.empresaId).toBe(mockUsuario.empresaId)
    })

    it('gera JWT com expiração configurada', async () => {
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUsuario as never)
      vi.mocked(verificarSenha).mockResolvedValue(true)

      const resultado = await AuthService.login({
        email: mockUsuario.email,
        senha: 'Cliente@123',
      })

      const payload = jwt.verify(
        resultado.token,
        process.env.JWT_SECRET!
      ) as jwt.JwtPayload

      expect(payload.exp).toBeDefined()
      expect(payload.iat).toBeDefined()
      expect(payload.exp! - payload.iat!).toBe(7 * 24 * 60 * 60)
    })

    it('mantém empresaId null para usuários sem empresa', async () => {
      const usuarioSemEmpresa = {
        ...mockUsuario,
        id: 'usuario-admin-001',
        email: 'admin@sistema.ao',
        papel: Papel.ADM,
        empresaId: null,
      }

      vi.mocked(prisma.usuario.findUnique).mockResolvedValue(
        usuarioSemEmpresa as never
      )
      vi.mocked(verificarSenha).mockResolvedValue(true)

      const resultado = await AuthService.login({
        email: usuarioSemEmpresa.email,
        senha: 'Admin@123',
      })

      expect(resultado.usuario.empresaId).toBeNull()

      const payload = jwt.verify(
        resultado.token,
        process.env.JWT_SECRET!
      ) as jwt.JwtPayload

      expect(payload.id).toBe(usuarioSemEmpresa.id)
      expect(payload.papel).toBe(Papel.ADM)
      expect(payload.empresaId).toBeNull()
    })
  })
})

