// =============================================================
// src/app.ts
// =============================================================
import express from 'express'
import path from 'path'
import cors from 'cors';
import { empresaRoutes } from '@/modules/empresa/empresa.routes'
import { usuarioRoutes } from '@/modules/usuario/usuario.routes'
import { funcionarioRoutes} from '@/modules/funcionario/funcionario.routes'
import { equipamentoRoutes  } from '@/modules/equipamento/equipamento.routes';
import { alertaRoutes } from '@/modules/alerta/alerta.routes'
import { licencaRoutes } from '@/modules/licenca/licenca.routes'
import { logRoutes } from '@/modules/log/log.routes'
import { relatorioRoutes } from '@/modules/relatorio/relatorio.routes'
import { pagamentoRoutes } from '@/modules/pagamento/pagamento.routes'
import { documentoRoutes } from '@/modules/documento/documento.routes'
import { authRoutes } from '@/modules/auth/auth.routes'
import { plataformaRoutes } from '@/modules/plataforma/plataforma.routes'
import { backupRoutes } from '@/modules/backup/backup.routes'
import { tratarErros } from '@/shared/middlewares/error.middleware'
import { registrarLog } from '@/shared/middlewares/logger.middleware'

// após criar o app:


const app = express()

app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://var-kappa.vercel.app',
  ],
  credentials: true,
}))

app.use(express.json())
app.use(registrarLog)

// Serve ficheiros estáticos (comprovativos/documentos enviados)
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')))

const v1 = '/api/v1'
app.use(v1, authRoutes)
app.use(v1, empresaRoutes)
app.use(v1, usuarioRoutes)
app.use(v1, funcionarioRoutes)
app.use(v1, equipamentoRoutes)
app.use(v1, alertaRoutes)
app.use(v1, licencaRoutes)
app.use(v1, pagamentoRoutes)
app.use(v1, logRoutes)
app.use(v1, relatorioRoutes)
app.use(v1, documentoRoutes)
app.use(v1, plataformaRoutes)
app.use(v1, backupRoutes)

app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date() }))

app.use(tratarErros)

export { app }