import { Response } from 'express';
import { prisma } from '../prisma/client';
import { AuthRequest } from '../middlewares/auth.middleware';

export const criarResultadoAnalise = async (req: AuthRequest, res: Response) => {
  try {
    const { registroImagemId, estadoDetectado, acuracia } = req.body;

    const registro = await prisma.registroImagem.findUnique({
      where: { id: registroImagemId },
      include: { dispositivo: { include: { equipamento: true } } }
    });

    if (!registro) {
      return res.status(404).json({ message: 'Registro de imagem não encontrado' });
    }

    if (req.user.papel === 'ADMIN_EMPRESA' || req.user.papel === 'FUNCIONARIO') {
      if (registro.dispositivo.equipamento.empresaId !== req.user.empresaId) {
        return res.status(403).json({ message: 'Não pode adicionar análise para registro de outra empresa' });
      }
    }

    const analise = await prisma.resultadoAnaliseIA.create({
      data: {
        registroImagemId,
        estadoDetectado,
        acuracia: acuracia ?? undefined
      }
    });

    res.status(201).json(analise);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao criar resultado de análise', error });
  }
};

export const listarAnalises = async (req: AuthRequest, res: Response) => {
  try {
    const { registroImagemId, take } = req.query;
    const where: any = {};

    if (registroImagemId) where.registroImagemId = String(registroImagemId);

    if (req.user.papel === 'ADMIN_EMPRESA' || req.user.papel === 'FUNCIONARIO') {
      where.registroImagem = { dispositivo: { equipamento: { empresaId: req.user.empresaId } } };
    }

    const analises = await prisma.resultadoAnaliseIA.findMany({
      where,
      include: { registroImagem: true },
      orderBy: { timestampAnalise: 'desc' },
      take: take ? Number(take) : undefined
    });

    res.json(analises);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao listar análises', error });
  }
};
