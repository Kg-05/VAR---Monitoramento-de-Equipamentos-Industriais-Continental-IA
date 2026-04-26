// =============================================================
// Data / Licença
// =============================================================
import { StatusLicenca } from '@prisma/client'

export function calcularStatusLicenca(expiraEm: Date, statusManual: StatusLicenca): StatusLicenca {
  if (statusManual === StatusLicenca.Suspensa) return StatusLicenca.Suspensa
  return new Date() > expiraEm ? StatusLicenca.Expirada : StatusLicenca.Ativa
}

export function diasParaExpirar(expiraEm: Date): number {
  const diff = expiraEm.getTime() - new Date().getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}
