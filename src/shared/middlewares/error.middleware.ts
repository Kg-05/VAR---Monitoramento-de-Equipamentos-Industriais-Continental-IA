import { Request, Response, NextFunction } from 'express';
import { AppError } from '@/shared/errors/AppError';
import { Prisma as PrismaErrors } from '@prisma/client';

export function tratarErros(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  // Erros de negócio conhecidos
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ success: false, message: err.message });
  }

  // Erros do Prisma
  if (err instanceof PrismaErrors.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return res.status(409).json({ success: false, message: 'Registo duplicado' });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Recurso não encontrado' });
    }
    if (err.code === 'P2003') {
      return res.status(400).json({ success: false, message: 'Referência inválida' });
    }
  }

  // Erro genérico (não expõe detalhes em produção)
  console.error('[ERROR]', err);
  return res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Erro interno do servidor' : err.message,
  });
}