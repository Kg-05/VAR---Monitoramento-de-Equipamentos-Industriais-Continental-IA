import { Request, Response, NextFunction } from 'express'
import { UsuarioService } from './usuario.service'
import { success, paginado, created, noContent } from '@/shared/utils/httpResponse'
import { Papel } from '@/shared/types/enums'
import { ForbiddenError } from '@/shared/errors/AppError'

export async function listarUsuarios(req: Request, res: Response, next: NextFunction) {
  try { return paginado(res, await UsuarioService.listar(req.query)) } catch (e) { next(e) }
}
export async function buscarUsuario(req: Request, res: Response, next: NextFunction) {
  try { return success(res, await UsuarioService.buscarPorId(req.params.id)) } catch (e) { next(e) }
}
export async function criarUsuario(req: Request, res: Response, next: NextFunction) {
  try { return created(res, await UsuarioService.criar(req.body, req.user!.papel as Papel)) } catch (e) { next(e) }
}
export async function atualizarUsuario(req: Request, res: Response, next: NextFunction) {
  try {
    const ehStaff     = req.user?.papel === Papel.ADM || req.user?.papel === Papel.Operacional
    const souOProprio = req.user?.id === req.params.id
    if (!ehStaff && !souOProprio) throw new ForbiddenError('Sem permissão para alterar este usuário')

    // Um utilizador comum só pode alterar o próprio nome/email —
    // apenas ADM/Operacional podem alterar o status de uma conta.
    const dados = ehStaff ? req.body : { nome: req.body.nome, email: req.body.email }
    return success(res, await UsuarioService.atualizar(req.params.id, dados))
  } catch (e) { next(e) }
}
export async function desativarUsuario(req: Request, res: Response, next: NextFunction) {
  try { await UsuarioService.desativar(req.params.id); return noContent(res) } catch (e) { next(e) }
}
