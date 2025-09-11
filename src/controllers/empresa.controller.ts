import { Response } from 'express';
import { prisma } from '../prisma/client';
import { AuthRequest } from '../middlewares/auth.middleware';

export const criarEmpresa = async (req: AuthRequest, res: Response) => {
  try {
    const { nome, nif, endereco, contacto, email } = req.body;
    const empresa = await prisma.empresa.create({
      data: { nome, nif, endereco, contacto, email }
    });
    res.status(201).json(empresa);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao criar empresa', error });
  }
};

export const listarEmpresas = async (req: AuthRequest, res: Response) => {
  try {
    let empresas;

    if (req.user.papel === "ADMIN_CENTRAL") {
      empresas = await prisma.empresa.findMany();
    } else if (req.user.papel === "ADMIN_EMPRESA") {
      empresas = await prisma.empresa.findMany({
        where: { id: req.user.empresaId },
      });
    } else {
      return res.status(403).json({ message: "Acesso negado" });
    }

    res.json(empresas);
  } catch (error) {
    res.status(500).json({ message: "Erro ao listar empresas", error });
  }
};

export const detalharEmpresa = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const empresa = await prisma.empresa.findUnique({ where: { id }});
    if (!empresa) return res.status(404).json({ message: 'Empresa não encontrada' });
    res.json(empresa);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar empresa', error });
  }
};

export const atualizarEmpresa = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const empresa = await prisma.empresa.update({ where: { id }, data });
    res.json(empresa);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao atualizar empresa', error });
  }
};

export const removerEmpresa = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.empresa.delete({ where: { id }});
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Erro ao remover empresa', error });
  }
};