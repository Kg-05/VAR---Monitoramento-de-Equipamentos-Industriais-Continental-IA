import { Response } from 'express';
import { prisma } from '../prisma/client';
import { AuthRequest } from '../middlewares/auth.middleware';

export const criarEquipamento = async (req: AuthRequest, res: Response) => {
  try {
    const { nome, modelo, numeroSerie, localizacao, empresaId } = req.body;

    // Se for ADMIN_EMPRESA, força o empresaId a ser do usuário logado
    let empresaDestino = empresaId;
    if (req.user.papel === 'ADMIN_EMPRESA') {
      empresaDestino = req.user.empresaId;
    }

    const equipamento = await prisma.equipamento.create({
      data: { empresaId: empresaDestino, nome, modelo, numeroSerie, localizacao }
    });

    res.status(201).json(equipamento);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao criar equipamento', error });
  }
};

export const listarEquipamentos = async (req: AuthRequest, res: Response) => {
  try {
    let where: any = {};

    if (req.user.papel === 'ADMIN_EMPRESA') {
      // Admin empresa só enxerga seus equipamentos
      where.empresaId = req.user.empresaId;
    } else if (req.query.empresaId) {
      // Admin central pode filtrar
      where.empresaId = String(req.query.empresaId);
    }

    const equipamentos = await prisma.equipamento.findMany({ where });
    res.json(equipamentos);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao listar equipamentos', error });
  }
};

export const detalharEquipamento = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const equipamento = await prisma.equipamento.findUnique({ where: { id }});

    if (!equipamento) return res.status(404).json({ message: 'Equipamento não encontrado' });

    // Se for ADMIN_EMPRESA, só pode ver se pertence à sua empresa
    if (req.user.papel === 'ADMIN_EMPRESA' && equipamento.empresaId !== req.user.empresaId) {
      return res.status(403).json({ message: 'Acesso negado a este equipamento' });
    }

    res.json(equipamento);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar equipamento', error });
  }
};

export const atualizarEquipamento = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Busca equipamento para validar
    const equipamentoExistente = await prisma.equipamento.findUnique({ where: { id }});
    if (!equipamentoExistente) {
      return res.status(404).json({ message: 'Equipamento não encontrado' });
    }

    if (req.user.papel === 'ADMIN_EMPRESA' && equipamentoExistente.empresaId !== req.user.empresaId) {
      return res.status(403).json({ message: 'Acesso negado a este equipamento' });
    }

    const data = req.body;
    const equipamento = await prisma.equipamento.update({ where: { id }, data });

    res.json(equipamento);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao atualizar equipamento', error });
  }
};

export const removerEquipamento = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const equipamentoExistente = await prisma.equipamento.findUnique({ where: { id }});
    if (!equipamentoExistente) {
      return res.status(404).json({ message: 'Equipamento não encontrado' });
    }

    if (req.user.papel === 'ADMIN_EMPRESA' && equipamentoExistente.empresaId !== req.user.empresaId) {
      return res.status(403).json({ message: 'Acesso negado a este equipamento' });
    }

    await prisma.equipamento.delete({ where: { id }});
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Erro ao remover equipamento', error });
  }
};