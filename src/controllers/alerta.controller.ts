import { Response } from 'express';
import { prisma } from '../prisma/client';
import { AuthRequest } from '../middlewares/auth.middleware';

export const criarAlerta = async (req: AuthRequest, res: Response) => {
  try {
    const { avariaId, empresaId, mensagem, severidade } = req.body;

    // Se for ADMIN_EMPRESA, só pode criar alerta da própria empresa
    if (req.user.papel === 'ADMIN_EMPRESA') {
      if (empresaId !== req.user.empresaId) {
        return res.status(403).json({ message: 'Não pode criar alerta para outra empresa' });
      }
    }

    const alerta = await prisma.alerta.create({
      data: { avariaId, empresaId, mensagem, severidade }
    });

    res.status(201).json(alerta);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao criar alerta', error });
  }
};

export const listarAlertas = async (req: AuthRequest, res: Response) => {
  try {
    const { apenasAtivos } = req.query;
    let where: any = {};

    if (req.user.papel === 'ADMIN_EMPRESA' || req.user.papel === 'FUNCIONARIO') {
      // Só alertas da empresa do usuário
      where.empresaId = req.user.empresaId;
    } else if (req.query.empresaId) {
      // Admin central pode filtrar
      where.empresaId = String(req.query.empresaId);
    }

    if (apenasAtivos === 'true') where.reconhecido = false;

    const alertas = await prisma.alerta.findMany({
      where,
      include: { avaria: true }
    });

    res.json(alertas);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao listar alertas', error });
  }
};

export const reconhecerAlerta = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { usuarioId } = req.body;

    const alertaExistente = await prisma.alerta.findUnique({ where: { id } });
    if (!alertaExistente) {
      return res.status(404).json({ message: 'Alerta não encontrado' });
    }

    // Verificar se pertence à empresa do usuário
    if (req.user.papel === 'ADMIN_EMPRESA' || req.user.papel === 'FUNCIONARIO') {
      if (alertaExistente.empresaId !== req.user.empresaId) {
        return res.status(403).json({ message: 'Não pode reconhecer alerta de outra empresa' });
      }
    }

    const alerta = await prisma.alerta.update({
      where: { id },
      data: {
        reconhecido: true,
        reconhecidoEm: new Date(),
        lidoPorId: usuarioId,
        lidoEm: new Date()
      }
    });

    res.json(alerta);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao reconhecer alerta', error });
  }
};