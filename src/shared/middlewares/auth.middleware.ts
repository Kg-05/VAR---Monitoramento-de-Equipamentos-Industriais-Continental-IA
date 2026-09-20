
import { Request, Response, NextFunction } from 'express'
import jwt, { JwtPayload } from 'jsonwebtoken'
import { UnauthorizedError } from '@/shared/errors/AppError'
import { Papel } from '@/shared/types/enums'
import { prisma } from '@/shared/database/prisma.client'

type AuthPayload = JwtPayload & {
  id: string
  papel: Papel
  empresaId?: string | null
  jti?: string
}

function isPapel(value: unknown): value is Papel {
  return Object.values(Papel).includes(value as Papel)
}

function isValidAuthPayload(
  payload: string | JwtPayload
): payload is AuthPayload {
  if (typeof payload === 'string') {
    return false
  }

  return (
    typeof payload.id === 'string' &&
    payload.id.length > 0 &&
    isPapel(payload.papel) &&
    (
      payload.empresaId === undefined ||
      payload.empresaId === null ||
      typeof payload.empresaId === 'string'
    )
  )
}

export async function autenticar(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization

  if (!authHeader?.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Token não fornecido'))
  }

  const token = authHeader.slice('Bearer '.length).trim()

  if (!token) {
    return next(new UnauthorizedError('Token não fornecido'))
  }

  const secret = process.env.JWT_SECRET

  if (!secret) {
    return next(
      new UnauthorizedError('Configuração de autenticação indisponível')
    )
  }

  try {
    const payload = jwt.verify(token, secret)

    if (!isValidAuthPayload(payload)) {
      return next(new UnauthorizedError('Token inválido'))
    }

    if (payload.jti) {
      const sessao = await prisma.sessaoAtiva.findUnique({ where: { jti: payload.jti } })
      if (!sessao || sessao.revogadaEm) {
        return next(new UnauthorizedError('Sessão encerrada'))
      }
      prisma.sessaoAtiva.update({ where: { jti: payload.jti }, data: { ultimoUso: new Date() } }).catch(() => {})
    }

    req.user = {
      id: payload.id,
      papel: payload.papel,
      empresaId: payload.empresaId ?? null,
    }

    next()
  } catch {
    next(new UnauthorizedError('Token inválido ou expirado'))
  }
}
