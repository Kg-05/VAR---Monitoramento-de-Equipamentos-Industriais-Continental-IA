// src/shared/middlewares/upload.middleware.ts
// Configuração do multer para upload de documentos/comprovativos.
// Armazenamento estático local na pasta /uploads/documentos.

import multer from 'multer'
import path from 'path'
import fs from 'fs'

const uploadDir = path.join(process.cwd(), 'uploads', 'documentos')

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext    = path.extname(file.originalname)
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`
    cb(null, unique)
  },
})

const EXTENSOES_PERMITIDAS = ['.pdf', '.jpg', '.jpeg', '.png']

export const uploadDocumento = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    if (EXTENSOES_PERMITIDAS.includes(ext)) {
      cb(null, true)
    } else {
      cb(new Error('Tipo de ficheiro não permitido. Use PDF, JPG ou PNG.'))
    }
  },
})