import { NextFunction } from "express"
import { Papel } from "../types/enums"

export function escopoEmpresa(req: Request, _res: Response, next: NextFunction) {
  const user = (req as any).user
  if (user?.papel === 'Cliente' && user.empresaId) {
    (req as any).query.empresaId  = user.empresaId
    if ((req as any).params?.empresaId) {
      (req as any).params.empresaId = user.empresaId
    }
  }
  next()
}
