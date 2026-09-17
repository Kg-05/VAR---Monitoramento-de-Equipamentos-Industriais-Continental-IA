import { Request, Response, NextFunction } from 'express'
import { Papel } from '@/shared/types/enums'

export function escopoEmpresa(req: Request, _res: Response, next: NextFunction) {
  const user = req.user

  if (user?.papel === Papel.Cliente && user.empresaId) {
    req.query.empresaId = user.empresaId

    if (req.params?.empresaId) {
      req.params.empresaId = user.empresaId
    }
  }

  next()
}
