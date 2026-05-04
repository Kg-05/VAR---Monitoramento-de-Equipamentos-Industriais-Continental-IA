// =============================================================
// src/app.ts
// =============================================================
import express from 'express'
import { empresaRoutes } from '@/modules/empresa/empresa.routes'
import { usuarioRoutes } from '@/modules/usuario/usuario.routes'
import { funcionarioRoutes} from '@/modules/funcionario/funcionario.routes'
import { equipamentoRoutes  } from '@/modules/equipamento/equipamento.routes';
import { alertaRoutes } from '@/modules/alerta/alerta.routes'
import { licencaRoutes } from '@/modules/licenca/licenca.routes'
import { logRoutes } from '@/modules/log/log.routes'
import { relatorioRoutes } from '@/modules/relatorio/relatorio.routes'
import { pagamentoRoutes } from '@/modules/pagamento/pagamento.routes'
import { authRoutes } from '@/modules/auth/auth.routes'
import { tratarErros } from '@/shared/middlewares/error.middleware'
import { registrarLog } from '@/shared/middlewares/logger.middleware'

const app = express()

app.use(express.json())
app.use(registrarLog)

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

app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date() }))

app.use(tratarErros)

export { app }
