import { Router } from 'express'
import { autenticar } from '@/shared/middlewares/auth.middleware'
import { autorizar } from '@/shared/middlewares/roles.middleware'
import { uploadBackup } from '@/shared/middlewares/upload.middleware'
import { Papel } from '@/shared/types/enums'
import { exportarBackup, restaurarBackup } from './backup.controller'

export const backupRoutes = Router()

backupRoutes.use('/backup', autenticar, autorizar(Papel.ADM))

backupRoutes.get(  '/backup/exportar',  exportarBackup)
backupRoutes.post( '/backup/restaurar', uploadBackup.single('ficheiro'), restaurarBackup)
