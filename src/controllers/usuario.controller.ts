import { Request, Response } from 'express';
import { prisma } from '../prisma/client';
import bcrypt from 'bcrypt';
import { AuthRequest } from '../middlewares/auth.middleware';

export const criarUsuario = async (req: AuthRequest, res: Response) => {
  try {
    const { nome, email, senha, papel, empresaId } = req.body;

    // Se for ADMIN_EMPRESA, só pode criar usuário na própria empresa
    if (req.user.papel === 'ADMIN_EMPRESA' && req.user.empresaId !== empresaId) {
      return res.status(403).json({ message: 'Você só pode criar usuários para a sua própria empresa' });
    }

    const emailExistente = await prisma.usuario.findFirst({ where: { email }});
    if (emailExistente) return res.status(400).json({ message: 'Email já em uso' });

    const senhaHash = await bcrypt.hash(senha, 10);

    const usuario = await prisma.usuario.create({
      data: { nome, email, senhaHash, papel, empresaId }
    });

    res.status(201).json({
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      papel: usuario.papel
    });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao criar usuário', error });
  }
};

export const listarUsuarios = async (req: AuthRequest, res: Response) => {
  try {
    let usuarios;

    if (req.user.papel === 'ADMIN_CENTRAL') {
      usuarios = await prisma.usuario.findMany({
        select: { id: true, nome: true, email: true, papel: true, empresaId: true }
      });
    } else if (req.user.papel === 'ADMIN_EMPRESA') {
      usuarios = await prisma.usuario.findMany({
        where: { empresaId: req.user.empresaId },
        select: { id: true, nome: true, email: true, papel: true, empresaId: true }
      });
    }

    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao listar usuários', error });
  }
};

export const detalharUsuario = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const usuario = await prisma.usuario.findUnique({ where: { id }});

    if (!usuario) return res.status(404).json({ message: 'Usuário não encontrado' });

    // ADMIN_EMPRESA só pode acessar usuários da própria empresa
    if (req.user.papel === 'ADMIN_EMPRESA' && usuario.empresaId !== req.user.empresaId) {
      return res.status(403).json({ message: 'Acesso negado a usuários de outra empresa' });
    }

    res.json(usuario);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar usuário', error });
  }
};

export const atualizarUsuario = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data: any = req.body;

    const usuarioExistente = await prisma.usuario.findUnique({ where: { id }});
    if (!usuarioExistente) return res.status(404).json({ message: 'Usuário não encontrado' });

    if (req.user.papel === 'ADMIN_EMPRESA' && usuarioExistente.empresaId !== req.user.empresaId) {
      return res.status(403).json({ message: 'Você só pode atualizar usuários da sua empresa' });
    }

    if (data.senha) {
      data.senhaHash = await bcrypt.hash(data.senha, 10);
      delete data.senha;
    }

    const usuario = await prisma.usuario.update({ where: { id }, data });

    res.json({ id: usuario.id, nome: usuario.nome, email: usuario.email, papel: usuario.papel });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao atualizar usuário', error });
  }
};

export const removerUsuario = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const usuarioExistente = await prisma.usuario.findUnique({ where: { id }});
    if (!usuarioExistente) return res.status(404).json({ message: 'Usuário não encontrado' });

    if (req.user.papel === 'ADMIN_EMPRESA' && usuarioExistente.empresaId !== req.user.empresaId) {
      return res.status(403).json({ message: 'Você só pode remover usuários da sua empresa' });
    }

    await prisma.usuario.delete({ where: { id }});
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Erro ao remover usuário', error });
  }
};

// Endpoint público de registro (signup)
export const registroPublico = async (req: Request, res: Response) => {
  try {
    const { nome, email, senha } = req.body;

    if (!nome || !email || !senha) {
      return res.status(400).json({ message: 'Nome, email e senha são obrigatórios' });
    }

    if (senha.length < 6) {
      return res.status(400).json({ message: 'Senha deve ter no mínimo 6 caracteres' });
    }

    const emailExistente = await prisma.usuario.findFirst({ where: { email }});
    if (emailExistente) {
      return res.status(400).json({ message: 'Email já em uso' });
    }

    const senhaHash = await bcrypt.hash(senha, 10);

    const usuario = await prisma.usuario.create({
      data: { 
        nome, 
        email, 
        senhaHash, 
        papel: 'FUNCIONARIO',
        ativo: true
      }
    });

    res.status(201).json({
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      papel: usuario.papel,
      message: 'Conta criada com sucesso! Faça login agora.'
    });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao criar conta', error });
  }
};