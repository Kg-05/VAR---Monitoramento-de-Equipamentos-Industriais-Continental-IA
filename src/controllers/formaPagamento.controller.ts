import { Response } from 'express';
import { prisma } from '../prisma/client';
import { AuthRequest } from '../middlewares/auth.middleware';

export const listarFormasPagamento = async (_req: AuthRequest, res: Response) => {
  try {
    const formas = await prisma.formaPagamento.findMany({ orderBy: { nome: 'asc' } });
    res.json(formas);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao listar formas de pagamento', error });
  }
};

export const criarFormaPagamento = async (req: AuthRequest, res: Response) => {
  try {
    const { nome, descricao } = req.body;

    const existente = await prisma.formaPagamento.findFirst({ where: { nome } });
    if (existente) return res.status(409).json({ message: 'Forma de pagamento já existe' });

    const forma = await prisma.formaPagamento.create({ data: { nome, descricao } });
    res.status(201).json(forma);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao criar forma de pagamento', error });
  }
};
