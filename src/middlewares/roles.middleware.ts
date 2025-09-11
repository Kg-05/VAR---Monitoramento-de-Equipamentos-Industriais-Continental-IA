import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';

export const autorizar = (...papeisPermitidos: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !papeisPermitidos.includes(req.user.papel)) {
      return res.status(403).json({ message: 'Acesso negado' });
    }
    next();
  };
};