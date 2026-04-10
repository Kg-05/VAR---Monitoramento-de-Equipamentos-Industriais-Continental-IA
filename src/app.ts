<<<<<<< HEAD
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
=======
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes";
import empresaRoutes from "./routes/empresa.routes";
import usuarioRoutes from "./routes/usuario.routes";
import equipamentoRoutes from "./routes/equipamento.routes";
import dispositivoRoutes from "./routes/dispositivo.routes";
import avariaRoutes from "./routes/avaria.routes";
import alertaRoutes from "./routes/alerta.routes";
import registroImagemRoutes from "./routes/registroImagem.routes";
import resultadoAnaliseRoutes from "./routes/resultadoAnalise.routes";
import formaPagamentoRoutes from "./routes/formaPagamento.routes";
import { logMiddleware } from "./middlewares/log.middleware";
>>>>>>> 1a80060dba5ef4477ebd1e748aff8d80e51a59c9

const app = express()

app.use(express.json())
app.use(registrarLog)

<<<<<<< HEAD
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
=======
app.use(cors());
app.use(express.json());
app.use(logMiddleware);
app.use(express.static("public"));

// rota raiz simples para verificar que o servidor está vivo
app.get("/", (_req, res) => {
	return res.status(200).json({ message: "VAR API rodando" });
});

// rotas
app.use("/auth", authRoutes);
app.use("/empresas", empresaRoutes);
app.use("/usuarios", usuarioRoutes);
app.use("/equipamentos", equipamentoRoutes);
app.use("/dispositivos", dispositivoRoutes);
app.use("/avarias", avariaRoutes);
app.use("/alertas", alertaRoutes);
app.use('/registro-imagem', registroImagemRoutes);
app.use('/analise-ia', resultadoAnaliseRoutes);
app.use('/formas-pagamento', formaPagamentoRoutes);
>>>>>>> 1a80060dba5ef4477ebd1e748aff8d80e51a59c9

app.use(tratarErros)

export { app }
