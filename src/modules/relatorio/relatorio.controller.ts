import { Request, Response, NextFunction } from 'express'
import { success } from '@/shared/utils/httpResponse'
import { RelatorioService } from './relatorio.service'

function parseFiltro(query: Record<string, unknown>): FiltroRelatorio {
  return {
    empresaId:  query.empresaId  as string | undefined,
    dataInicio: query.dataInicio ? new Date(query.dataInicio as string) : undefined,
    dataFim:    query.dataFim    ? new Date(query.dataFim    as string) : undefined,
  }
}

export async function relatorioAlertas(req: Request, res: Response, next: NextFunction) {
  try {
    return success(res, await RelatorioService.alertas(parseFiltro(req.query)))
  } catch (e) { next(e) }
}

export async function relatorioFinanceiro(req: Request, res: Response, next: NextFunction) {
  try {
    return success(res, await RelatorioService.financeiro(parseFiltro(req.query)))
  } catch (e) { next(e) }
}

export async function relatorioLicencas(req: Request, res: Response, next: NextFunction) {
  try {
    return success(res, await RelatorioService.licencas(parseFiltro(req.query)))
  } catch (e) { next(e) }
}

export async function relatorioEquipamentos(req: Request, res: Response, next: NextFunction) {
  try {
    return success(res, await RelatorioService.equipamentos(parseFiltro(req.query)))
  } catch (e) { next(e) }
}
