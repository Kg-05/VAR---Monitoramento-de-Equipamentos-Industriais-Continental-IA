import { Response } from 'express';
import { prisma } from '../prisma/client';
import { AuthRequest } from '../middlewares/auth.middleware';

export const criarRegistroImagem = async (req: AuthRequest, res: Response) => {
  try {
    const { dispositivoId, caminhoArquivo, timestampCaptura } = req.body;

    const dispositivo = await prisma.dispositivo.findUnique({
      where: { id: dispositivoId },
      include: { equipamento: true }
    });

    if (!dispositivo) {
      return res.status(404).json({ message: 'Dispositivo não encontrado' });
    }

    if (req.user.papel === 'ADMIN_EMPRESA' || req.user.papel === 'FUNCIONARIO') {
      if (dispositivo.equipamento.empresaId !== req.user.empresaId) {
        return res.status(403).json({ message: 'Não pode adicionar registro em dispositivo de outra empresa' });
      }
    }

    const registro = await prisma.registroImagem.create({
      data: {
        dispositivoId,
        caminhoArquivo,
        timestampCaptura: timestampCaptura ? new Date(timestampCaptura) : undefined,
      }
    });

    res.status(201).json(registro);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao criar registro de imagem', error });
  }
};

export const listarRegistroImagens = async (req: AuthRequest, res: Response) => {
  try {
    const { dispositivoId, take } = req.query;
    const where: any = {};

    if (dispositivoId) where.dispositivoId = String(dispositivoId);

    if (req.user.papel === 'ADMIN_EMPRESA' || req.user.papel === 'FUNCIONARIO') {
      where.dispositivo = { equipamento: { empresaId: req.user.empresaId } };
    }

    const registros = await prisma.registroImagem.findMany({
      where,
      include: { analises: true, dispositivo: true },
      orderBy: { criadoEm: 'desc' },
      take: take ? Number(take) : undefined
    });

    res.json(registros);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao listar registros de imagem', error });
  }
};
