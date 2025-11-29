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

dotenv.config();

const app = express();

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

export default app;