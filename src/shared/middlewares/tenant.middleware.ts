import { Request, Response, NextFunction } from 'express'
import { Papel } from '@/shared/types/enums'

export function escopoEmpresa(req: Request, _res: Response, next: NextFunction) {
  const user = req.user

  // Cliente e Tecnico só veem/mexem em dados da própria empresa.
  const papeisComEscopo: Papel[] = [Papel.Cliente, Papel.Tecnico]

  if (user && papeisComEscopo.includes(user.papel) && user.empresaId) {
    req.query.empresaId = user.empresaId

    if (req.params?.empresaId) {
      req.params.empresaId = user.empresaId
    }
  }

  next()
}
