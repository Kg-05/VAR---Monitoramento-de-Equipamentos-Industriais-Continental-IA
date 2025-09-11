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
import { logMiddleware } from "./middlewares/log.middleware";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(logMiddleware);

// rotas
app.use("/auth", authRoutes);
app.use("/empresas", empresaRoutes);
app.use("/usuarios", usuarioRoutes);
app.use("/equipamentos", equipamentoRoutes);
app.use("/dispositivos", dispositivoRoutes);
app.use("/avarias", avariaRoutes);
app.use("/alertas", alertaRoutes);

export default app;