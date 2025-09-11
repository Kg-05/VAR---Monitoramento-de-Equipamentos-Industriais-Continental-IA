import { Response } from 'express';
import { prisma } from '../prisma/client';
import { AuthRequest } from '../middlewares/auth.middleware';

export const criarAvaria = async (req: AuthRequest, res: Response) => {
  try {
    const { equipamentoId, dispositivoId, detectadoPor, descricao, confianca, severidade, imagemUrl } = req.body;

    // Garantir que ADMIN_EMPRESA e FUNCIONARIO só criem avarias da sua empresa para testes
    const equipamento = await prisma.equipamento.findUnique({ where: { id: equipamentoId } });
    if (!equipamento) return res.status(404).json({ message: 'Equipamento não encontrado' });

    if (req.user.papel === 'ADMIN_EMPRESA' || req.user.papel === 'FUNCIONARIO') {
      if (equipamento.empresaId !== req.user.empresaId) {
        return res.status(403).json({ message: 'Acesso negado ao criar avaria de teste neste equipamento' });
      }
    }

    const avaria = await prisma.avaria.create({
      data: {
        equipamentoId,
        dispositivoId,
        detectadoPor,
        descricao,
        confianca,
        severidade,
        imagemUrl
      }
    });

    res.status(201).json(avaria);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao registrar avaria', error });
  }
};

export const listarAvarias = async (req: AuthRequest, res: Response) => {
  try {
    let where: any = {};

    if (req.user.papel === 'ADMIN_EMPRESA' || req.user.papel === 'FUNCIONARIO') {
      // Apenas da empresa do usuário
      where.equipamento = { empresaId: req.user.empresaId };
    } else if (req.query.empresaId) {
      // Admin central pode filtrar por empresaId
      where.equipamento = { empresaId: String(req.query.empresaId) };
    }

    if (req.query.equipamentoId) {
      where.equipamentoId = String(req.query.equipamentoId);
    }

    const avarias = await prisma.avaria.findMany({
      where,
      include: { equipamento: true, dispositivo: true }
    });

    res.json(avarias);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao listar avarias', error });
  }
};

export const resolverAvaria = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { resolvidoPorId } = req.body;

    const avariaExistente = await prisma.avaria.findUnique({ where: { id } });
    if (!avariaExistente) {
      return res.status(404).json({ message: 'Avaria não encontrada' });
    }

    // Verificar se pertence à empresa do usuário
    const equipamento = await prisma.equipamento.findUnique({ where: { id: avariaExistente.equipamentoId } });
    if (!equipamento) return res.status(404).json({ message: 'Equipamento da avaria não encontrado' });

    if (req.user.papel === 'ADMIN_EMPRESA' || req.user.papel === 'FUNCIONARIO') {
      if (equipamento.empresaId !== req.user.empresaId) {
        return res.status(403).json({ message: 'Acesso negado a esta avaria' });
      }
    }

    const avaria = await prisma.avaria.update({
      where: { id },
      data: { resolvido: true, resolvidoEm: new Date(), resolvidoPorId }
    });

    res.json(avaria);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao resolver avaria', error });
  }
};