import { NextFunction } from "express"
import { Papel } from "../types/enums"

export function escopoEmpresa(req: Request, _res: Response, next: NextFunction) {
  if (req.user?.papel === Papel.Cliente && req.user.empresaId) {
    // Força empresaId da query a ser sempre o da empresa do token
    req.query.empresaId = req.user.empresaId
    if (req.params.empresaId) req.params.empresaId = req.user.empresaId
  }
  next()
}
