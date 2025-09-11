import { prisma } from "../prisma/client";

export const registrarLog = async ({
  usuarioId,
  empresaId,
  nivel = "INFO",
  acao,
  dados = null,
}: {
  usuarioId?: string;
  empresaId?: string;
  nivel?: string;
  acao: string;
  dados?: any;
}) => {
  try {
    await prisma.log.create({
      data: {
        usuarioId,
        empresaId,
        nivel,
        acao,
        dados,
      },
    });
  } catch (error) {
    console.error("Erro ao salvar log:", error);
  }
};