import { Request, Response, NextFunction } from 'express'
import { UsuarioService } from './usuario.service'
import { success, created, noContent } from '@/shared/utils/httpResponse'
import { Papel } from '@/shared/types/enums'

export async function listarUsuarios(req: Request, res: Response, next: NextFunction) {
  try { return success(res, await UsuarioService.listar(req.query)) } catch (e) { next(e) }
}
export async function buscarUsuario(req: Request, res: Response, next: NextFunction) {
  try { return success(res, await UsuarioService.buscarPorId(req.params.id)) } catch (e) { next(e) }
}
export async function criarUsuario(req: Request, res: Response, next: NextFunction) {
  try { return created(res, await UsuarioService.criar(req.body, req.user!.papel as Papel)) } catch (e) { next(e) }
}
export async function atualizarUsuario(req: Request, res: Response, next: NextFunction) {
  try { return success(res, await UsuarioService.atualizar(req.params.id, req.body)) } catch (e) { next(e) }
}
export async function desativarUsuario(req: Request, res: Response, next: NextFunction) {
  try { await UsuarioService.desativar(req.params.id); return noContent(res) } catch (e) { next(e) }
}
