import jwt from 'jsonwebtoken'
import { prisma }           from '@/shared/database/prisma.client'
import { verificarSenha }   from '@/shared/utils/hashSenha'
import { UnauthorizedError } from '@/shared/errors/AppError'
import type { LoginDto }    from './auth.schema'

export const AuthService = {
  async login(data: LoginDto) {
    const usuario = await prisma.usuario.findUnique({ where: { email: data.email } })

    if (!usuario || usuario.status === 'Inativo') {
      throw new UnauthorizedError('Credenciais inválidas')
    }

    const senhaValida = await verificarSenha(data.senha, usuario.senhaHash)
    if (!senhaValida) {
      throw new UnauthorizedError('Credenciais inválidas')
    }

    const payload = {
      id:        usuario.id,
      papel:     usuario.papel,
      empresaId: usuario.empresaId,
    }

    const token = jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
    } as jwt.SignOptions)

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