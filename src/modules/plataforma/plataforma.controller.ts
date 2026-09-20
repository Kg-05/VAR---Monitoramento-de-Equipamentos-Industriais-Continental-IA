import { Request, Response, NextFunction } from 'express'
import { PlataformaService } from './plataforma.service'
import { success } from '@/shared/utils/httpResponse'
import { UnauthorizedError } from '@/shared/errors/AppError'

export async function obterPlataforma(req: Request, res: Response, next: NextFunction) {
  try { return success(res, await PlataformaService.obter()) } catch (e) { next(e) }
}

export async function atualizarPlataforma(req: Request, res: Response, next: NextFunction) {
  try { return success(res, await PlataformaService.atualizar(req.body)) } catch (e) { next(e) }
}

export async function atualizarLogotipo(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) throw new UnauthorizedError('Nenhum ficheiro enviado')
    return success(res, await PlataformaService.atualizarLogotipo(`/uploads/imagens/${req.file.filename}`))
  } catch (e) { next(e) }
}
