import { Request, Response, NextFunction } from "express";
import { registrarLog } from "../utils/logger";

export const logMiddleware = async (req: any, res: Response, next: NextFunction) => {
  const start = Date.now();

  // Intercepta resposta
  res.on("finish", async () => {
    const duracao = Date.now() - start;

    const usuario = req.user || null;
    const acao = `${req.method} ${req.originalUrl}`;
    const nivel = res.statusCode >= 400 ? "ERRO" : "INFO";

    await registrarLog({
      usuarioId: usuario?.id,
      empresaId: usuario?.empresaId,
      nivel,
      acao,
      dados: {
        status: res.statusCode,
        duracao,
        body: req.body,
        query: req.query,
        params: req.params,
      },
    });
  });

  next();
};