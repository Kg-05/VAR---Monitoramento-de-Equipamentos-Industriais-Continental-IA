import { Response } from 'express';
import { prisma } from '../prisma/client';
import { AuthRequest } from '../middlewares/auth.middleware';

export const criarDispositivo = async (req: AuthRequest, res: Response) => {
  try {
    const { equipamentoId, nome, tipo, rtspUrl } = req.body;

    // Se ADMIN_EMPRESA, só pode criar dispositivo para equipamento da sua empresa
    if (req.user.papel === 'ADMIN_EMPRESA') {
      const equipamento = await prisma.equipamento.findUnique({
        where: { id: equipamentoId }
      });

      if (!equipamento || equipamento.empresaId !== req.user.empresaId) {
        return res.status(403).json({ message: 'Não pode criar dispositivo em equipamento de outra empresa' });
      }
    }

    const dispositivo = await prisma.dispositivo.create({
      data: { equipamentoId, nome, tipo, rtspUrl }
    });

    res.status(201).json(dispositivo);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao criar dispositivo', error });
  }
};

export const listarDispositivos = async (req: AuthRequest, res: Response) => {
  try {
    const { equipamentoId } = req.query;
    let where: any = {};

    if (equipamentoId) {
      where.equipamentoId = String(equipamentoId);
    }

    if (req.user.papel === 'ADMIN_EMPRESA' || req.user.papel === 'FUNCIONARIO') {
      // Só dispositivos de equipamentos da empresa do usuário
      where.equipamento = { empresaId: req.user.empresaId };
    }

    const dispositivos = await prisma.dispositivo.findMany({
      where,
      include: { equipamento: true }
    });

    res.json(dispositivos);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao listar dispositivos', error });
  }
};

export const atualizarDispositivo = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const dispositivoExistente = await prisma.dispositivo.findUnique({
      where: { id },
      include: { equipamento: true }
    });

    if (!dispositivoExistente) {
      return res.status(404).json({ message: 'Dispositivo não encontrado' });
    }

    if (req.user.papel === 'ADMIN_EMPRESA') {
      if (dispositivoExistente.equipamento.empresaId !== req.user.empresaId) {
        return res.status(403).json({ message: 'Não pode atualizar dispositivo de outra empresa' });
      }
    }

    const dispositivo = await prisma.dispositivo.update({
      where: { id },
      data
    });

    res.json(dispositivo);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao atualizar dispositivo', error });
  }
};

export const removerDispositivo = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const dispositivoExistente = await prisma.dispositivo.findUnique({
      where: { id },
      include: { equipamento: true }
    });

    if (!dispositivoExistente) {
      return res.status(404).json({ message: 'Dispositivo não encontrado' });
    }

    if (req.user.papel === 'ADMIN_EMPRESA') {
      if (dispositivoExistente.equipamento.empresaId !== req.user.empresaId) {
        return res.status(403).json({ message: 'Não pode remover dispositivo de outra empresa' });
      }
    }

    await prisma.dispositivo.delete({ where: { id } });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Erro ao remover dispositivo', error });
  }
};