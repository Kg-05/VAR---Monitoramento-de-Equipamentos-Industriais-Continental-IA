// =============================================================
// src/app.ts
// =============================================================
import express from 'express'
import { empresaRoutes }    from '@/modules/empresa/empresa'
import { usuarioRoutes }    from '@/modules/usuario/usuario'
import { funcionarioRoutes, equipamentoRoutes } from '@/modules/funcionario/funcionario-equipamento'
import { alertaRoutes }     from '@/modules/alerta/alerta'
import { licencaRoutes, pagamentoRoutes, logRoutes, relatorioRoutes } from '@/modules/licenca/licenca-pagamento-log-relatorio'
import { authRoutes }       from '@/modules/auth/auth'
import { registrarLog, tratarErros } from '@/shared/middlewares/index'

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
