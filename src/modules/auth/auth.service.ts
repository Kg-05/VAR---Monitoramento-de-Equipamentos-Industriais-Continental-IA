import jwt from 'jsonwebtoken'
import { randomUUID } from 'crypto'
import { prisma }           from '@/shared/database/prisma.client'
import { verificarSenha }   from '@/shared/utils/hashSenha'
import { UnauthorizedError } from '@/shared/errors/AppError'
import type { LoginDto }    from './auth.schema'

interface ContextoSessao {
  userAgent?: string
  ip?: string
}

async function emitirToken(usuario: { id: string; papel: string; empresaId: string | null }, contexto: ContextoSessao) {
  const jti = randomUUID()
  const payload = {
    id:        usuario.id,
    papel:     usuario.papel,
    empresaId: usuario.empresaId,
    jti,
  }

  const token = jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  } as jwt.SignOptions)

  await prisma.sessaoAtiva.create({
    data: {
      jti,
      usuarioId: usuario.id,
      userAgent: contexto.userAgent,
      ip:        contexto.ip,
    },
  })

  return token
}

export const AuthService = {
  async login(data: LoginDto, contexto: ContextoSessao = {}) {
    const usuario = await prisma.usuario.findUnique({ where: { email: data.email } })

    if (!usuario || usuario.status === 'Inativo') {
      throw new UnauthorizedError('Credenciais inválidas')
    }

    const senhaValida = await verificarSenha(data.senha, usuario.senhaHash)
    if (!senhaValida) {
      throw new UnauthorizedError('Credenciais inválidas')
    }

    if (usuario.totpAtivo) {
      return { totpRequerido: true, usuarioId: usuario.id }
    }

    const token = await emitirToken(usuario, contexto)

    return {
      token,
      usuario: {
        id:        usuario.id,
        nome:      usuario.nome,
        email:     usuario.email,
        papel:     usuario.papel,
        empresaId: usuario.empresaId,
      },
    }
  },

  async loginComTotp(usuarioId: string, codigo: string, contexto: ContextoSessao = {}) {
    const { UsuarioService } = await import('@/modules/usuario/usuario.service')
    const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } })
    if (!usuario || usuario.status === 'Inativo') {
      throw new UnauthorizedError('Credenciais inválidas')
    }
    const valido = await UsuarioService.verificarTotp(usuarioId, codigo)
    if (!valido) throw new UnauthorizedError('Código de verificação inválido')

    const token = await emitirToken(usuario, contexto)

    return {
      token,
      usuario: {
        id:        usuario.id,
        nome:      usuario.nome,
        email:     usuario.email,
        papel:     usuario.papel,
        empresaId: usuario.empresaId,
      },
    }
  },
}
