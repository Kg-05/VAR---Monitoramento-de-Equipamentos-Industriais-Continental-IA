import { Request, Response, NextFunction } from 'express';
import { prisma } from '@/shared/database/prisma.client';

export function registrarLog(req: Request, res: Response, next: NextFunction) {
  res.on('finish', async () => {
    if (!req.user) return;
    try {
      await prisma.log.create({
        data: {
          acao: `${req.method} ${req.path}`,
          nivelUsuario: req.user.papel as any,
          ip: req.ip,
          userAgent: req.headers['user-agent'],
          statusHttp: res.statusCode,
          usuarioId: req.user.id,
          empresaId: req.user.empresaId,
        },
      });
    } catch {
      // Log nunca deve quebrar a requisição
    }
  });
  next();
}