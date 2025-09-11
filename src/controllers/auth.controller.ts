import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { registrarLog } from "../utils/logger";

const prisma = new PrismaClient();

// ---------------------- LOGIN ----------------------
export const login = async (req: Request, res: Response) => {
  try {
    const { email, senha } = req.body;

    const usuario = await prisma.usuario.findFirst({ where: { email } });
    if (!usuario) {
      // Log de falha
      await registrarLog({
        nivel: "AVISO",
        acao: "Tentativa de login com email inválido",
        dados: { email },
      });

      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senhaHash);
    if (!senhaValida) {
      // Log de senha incorreta
      await registrarLog({
        usuarioId: usuario.id,
        empresaId: usuario.empresaId || undefined,
        nivel: "AVISO",
        acao: "Tentativa de login com senha incorreta",
        dados: { email },
      });

      return res.status(401).json({ message: "Senha incorreta" });
    }

    const token = jwt.sign(
      { id: usuario.id, papel: usuario.papel, empresaId: usuario.empresaId },
      process.env.JWT_SECRET || "kituxi_group25",
      { expiresIn: "12h" }
    );

    // Log de sucesso
    await registrarLog({
      usuarioId: usuario.id,
      empresaId: usuario.empresaId || undefined,
      nivel: "INFO",
      acao: "Login realizado com sucesso",
      dados: { email },
    });

    return res.json({ token });
  } catch (error: any) {
    console.error("Erro no login:", error);

    // Log de erro crítico
    await registrarLog({
      nivel: "ERROR",
      acao: "Erro interno no login",
      dados: { erro: error.message },
    });

    return res.status(500).json({
      message: "Erro no login",
      detalhe: error.message,
    });
  }
};

// ---------------------- REGISTRAR ----------------------
export const registrar = async (req: any, res: Response) => {
  try {
    const { nome, email, senha, papel, empresaId } = req.body;

    // quem está autenticado
    const usuarioAuth = req.user;

    if (!usuarioAuth) {
      return res.status(401).json({ message: "Não autenticado" });
    }

    // regras de criação
    if (usuarioAuth.papel === "ADMIN_CENTRAL") {
      // ADMIN_CENTRAL pode criar qualquer papel
      if (!papel) {
        return res.status(400).json({ message: "O papel/função do usuário é obrigatório" });
      }
    } else if (usuarioAuth.papel === "ADMIN_EMPRESA") {
      // ADMIN_EMPRESA só cria FUNCIONARIOS
      if (papel !== "FUNCIONARIO") {
        return res.status(403).json({ message: "Você só pode criar FUNCIONÁRIOS" });
      }
    } else {
      return res.status(403).json({ message: "Você não tem permissão para registrar usuários" });
    }

    // verificar email duplicado
    const emailExistente = await prisma.usuario.findFirst({ where: { email } });
    if (emailExistente) {
      return res.status(400).json({ message: "Email já em uso" });
    }

    const senhaHash = await bcrypt.hash(senha, 10);

    const novoUsuario = await prisma.usuario.create({
      data: {
        nome,
        email,
        senhaHash,
        papel,
        empresaId: usuarioAuth.papel === "ADMIN_EMPRESA" ? usuarioAuth.empresaId : empresaId, // força empresa do admin
      },
    });

    res.status(201).json({
      id: novoUsuario.id,
      nome: novoUsuario.nome,
      email: novoUsuario.email,
      papel: novoUsuario.papel,
      empresaId: novoUsuario.empresaId,
    });
  } catch (error: any) {
    console.error("Erro ao registrar usuário:", error);
    res.status(500).json({ message: "Erro ao registrar usuário", detalhe: error.message });
  }
};