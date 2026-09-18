// =============================================================
// Resposta HTTP padronizada
//
// Contrato único usado em toda a API — o front-end depende
// exactamente desta forma (ver front/types/index.ts):
//
//   sucesso simples : { success: true, data: T }
//   listagem        : { success: true, data: T[], meta: {...} }
//   erro            : { success: false, message: string, errors?: {...} }
// =============================================================
import type { Response } from 'express'
import type { PaginatedResult } from './page'

export function success<T>(res: Response, data: T, statusCode = 200) {
  return res.status(statusCode).json({ success: true, data })
}

export function created<T>(res: Response, data: T) {
  return success(res, data, 201)
}

export function noContent(res: Response) {
  return res.status(204).send()
}

// Usar SEMPRE que o valor devolvido pelo service for um
// PaginatedResult (isto é, o service chamou `paginar(...)`).
// Achata a estrutura para `data` e `meta` ficarem ao mesmo nível
// da resposta, em vez de aninhados dentro de `data.data`.
export function paginado<T>(res: Response, resultado: PaginatedResult<T>, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    data: resultado.data,
    meta: resultado.meta,
  })
}
