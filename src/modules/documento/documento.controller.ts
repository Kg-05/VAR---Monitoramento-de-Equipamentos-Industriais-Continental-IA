// src/modules/documento/documento.controller.ts
import { Request, Response, NextFunction } from 'express'
import { DocumentoService } from './documento.service'
import { success, created, noContent } from '@/shared/utils/httpResponse'

export async function listarDocumentos(req: Request, res: Response, next: NextFunction) {
  try { return success(res, await DocumentoService.listar(req.query)) } catch (e) { next(e) }
}

export async function criarDocumento(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Nenhum ficheiro enviado' })
    }
    const { empresaId } = req.body
    if (!empresaId) {
      return res.status(400).json({ success: false, message: 'empresaId é obrigatório' })
    }

    // @ts-ignore — usuario injectado pelo middleware de autenticação
    const usuarioId = req.usuario?.id

    const documento = await DocumentoService.criar({
      empresaId,
      responsavelId: usuarioId,
      nomeArquivo:   req.file.originalname,
      caminho:       `/uploads/documentos/${req.file.filename}`,
    })
    return created(res, documento)
  } catch (e) { next(e) }
}

export async function marcarLidoDocumento(req: Request, res: Response, next: NextFunction) {
  try { return success(res, await DocumentoService.marcarComoLido(req.params.id)) } catch (e) { next(e) }
}

export async function arquivarDocumento(req: Request, res: Response, next: NextFunction) {
  try { return success(res, await DocumentoService.arquivar(req.params.id)) } catch (e) { next(e) }
}

export async function removerDocumento(req: Request, res: Response, next: NextFunction) {
  try { await DocumentoService.remover(req.params.id); return noContent(res) } catch (e) { next(e) }
}

export async function resumoDocumentos(req: Request, res: Response, next: NextFunction) {
  try { return success(res, await DocumentoService.resumo()) } catch (e) { next(e) }
}