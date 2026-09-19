import { Request, Response, NextFunction } from 'express'
import { BackupService } from './backup.service'
import { AppError } from '@/shared/errors/AppError'

export async function exportarBackup(req: Request, res: Response, next: NextFunction) {
  try {
    const backup = await BackupService.exportar()
    res.setHeader('Content-Disposition', `attachment; filename="backup_${new Date().toISOString().slice(0, 10)}.json"`)
    return res.status(200).json(backup)
  } catch (e) { next(e) }
}

export async function restaurarBackup(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) throw new AppError('Nenhum ficheiro de backup enviado', 400)
    let backup: unknown
    try {
      backup = JSON.parse(req.file.buffer.toString('utf-8'))
    } catch {
      throw new AppError('Ficheiro de backup não é um JSON válido', 400)
    }
    const resultado = await BackupService.restaurar(backup)
    return res.status(200).json({ success: true, data: resultado })
  } catch (e) { next(e) }
}
