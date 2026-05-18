import { Request, Response, NextFunction } from 'express';
import { prisma } from '@/shared/database/prisma.client'
 
export function registrarLog(req: Request, res: Response, next: NextFunction) {
  res.on('finish', async () => {
    const user = (req as any).user
    if (!user) return
    try {
      await prisma.log.create({
        data: {
          acao:         `${req.method} ${req.path}`,
          nivelUsuario: user.papel,
          ip:           req.ip,
          userAgent:    req.headers['user-agent'],
          statusHttp:   res.statusCode,
          usuarioId:    user.id,
          empresaId:    user.empresaId,
        },
      })
    } catch { /* log nunca deve quebrar a requisição */ }
  })
  next()
}