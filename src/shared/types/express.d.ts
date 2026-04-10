import { Papel } from '@/shared/types/enums'

declare global {
  namespace Express {
    interface Request {
      user?: {
        id:        string
        papel:     Papel
        empresaId: string | null
      }
    }
  }
}
