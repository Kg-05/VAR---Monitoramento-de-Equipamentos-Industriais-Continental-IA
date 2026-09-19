// src/modules/usuario/usuario.service.ts
import { Papel, StatusUsuario } from '@prisma/client'
import { authenticator } from 'otplib'
import QRCode from 'qrcode'
import { prisma }           from '@/shared/database/prisma.client'
import { NotFoundError, ConflictError, ForbiddenError, UnauthorizedError } from '@/shared/errors/AppError'
import { hashSenha, verificarSenha } from '@/shared/utils/hashSenha'
import { parsePagination, paginar } from '@/shared/utils/page'

// Select explícito — nunca retorna senhaHash nem totpSecret
const selectSemSenha = {
  id:                    true,
  email:                 true,
  nome:                  true,
  papel:                 true,
  status:                true,
  empresaId:             true,
  criadoEm:              true,
  updatedAt:             true,
  avatarUrl:             true,
  totpAtivo:             true,
  notificacaoEmailAtiva: true,
  permissaoAlertas:      true,
  permissaoGestao:       true,
  empresa:               { select: { id: true, nome: true } },
} as const

export const UsuarioService = {

  async listar(query: Record<string, any>) {
    const pagination = parsePagination(query)
    const where: any = {}
    if (query.papel)     where.papel     = query.papel
    if (query.empresaId) where.empresaId = query.empresaId
    if (query.search) {
      where.OR = [
        { nome:  { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ]
    }
    const [usuarios, total] = await prisma.$transaction([
      prisma.usuario.findMany({
        where,
        skip:    pagination.skip,
        take:    pagination.take,
        orderBy: { criadoEm: 'desc' },
        select:  selectSemSenha,
      }),
      prisma.usuario.count({ where }),
    ])
    return paginar(usuarios, total, pagination)
  },

  async buscarPorId(id: string) {
    const u = await prisma.usuario.findUnique({
      where:  { id },
      select: selectSemSenha,
    })
    if (!u) throw new NotFoundError('Usuário não encontrado')
    return u
  },

  async criar(data: { email: string; nome: string; senha: string; papel: Papel; empresaId?: string }, solicitantePapel: string) {
    if (solicitantePapel === Papel.Operacional && data.papel !== Papel.Cliente) {
      throw new ForbiddenError('Operacional só pode criar usuários do tipo Cliente')
    }
    if (data.papel === Papel.Cliente && !data.empresaId) {
      throw new ConflictError('Usuário Cliente precisa de empresa vinculada')
    }
    if (await prisma.usuario.findUnique({ where: { email: data.email } })) {
      throw new ConflictError('Email já cadastrado')
    }
    if (data.empresaId && !await prisma.empresa.findUnique({ where: { id: data.empresaId } })) {
      throw new NotFoundError('Empresa não encontrada')
    }
    const { senha, ...resto } = data
    return prisma.usuario.create({
      data:   { ...resto, senhaHash: await hashSenha(senha) },
      select: selectSemSenha,
    })
  },

  async atualizar(id: string, data: { nome?: string; email?: string; status?: string }) {
    await UsuarioService.buscarPorId(id)
    if (data.email) {
      if (await prisma.usuario.findFirst({ where: { email: data.email, NOT: { id } } })) {
        throw new ConflictError('Email já em uso')
      }
    }
    // Cast explícito para satisfazer o Prisma
    const updateData: any = { ...data }
    return prisma.usuario.update({
      where:  { id },
      data:   updateData,
      select: selectSemSenha,
    })
  },

  async desativar(id: string) {
    await UsuarioService.buscarPorId(id)
    return prisma.usuario.update({
      where:  { id },
      data:   { status: StatusUsuario.Inativo },
      select: selectSemSenha,
    })
  },

  async buscarPorEmailComSenha(email: string) {
    return prisma.usuario.findUnique({ where: { email } })
  },

  async alterarSenha(id: string, senhaAtual: string, novaSenha: string) {
    const usuario = await prisma.usuario.findUnique({ where: { id } })
    if (!usuario) throw new NotFoundError('Usuário não encontrado')
    if (!await verificarSenha(senhaAtual, usuario.senhaHash)) {
      throw new UnauthorizedError('Senha atual incorreta')
    }
    await prisma.usuario.update({ where: { id }, data: { senhaHash: await hashSenha(novaSenha) } })
  },

  async atualizarAvatar(id: string, avatarUrl: string) {
    await UsuarioService.buscarPorId(id)
    return prisma.usuario.update({ where: { id }, data: { avatarUrl }, select: selectSemSenha })
  },

  async definirNotificacaoEmail(id: string, ativa: boolean) {
    await UsuarioService.buscarPorId(id)
    return prisma.usuario.update({ where: { id }, data: { notificacaoEmailAtiva: ativa }, select: selectSemSenha })
  },

  async definirPermissoes(id: string, dados: { permissaoAlertas?: boolean; permissaoGestao?: boolean }) {
    await UsuarioService.buscarPorId(id)
    return prisma.usuario.update({ where: { id }, data: dados, select: selectSemSenha })
  },

  async gerarSegredoTotp(id: string) {
    const usuario = await UsuarioService.buscarPorId(id)
    const segredo = authenticator.generateSecret()
    const otpauthUrl = authenticator.keyuri(usuario.email, 'VAR Kituxi Tech', segredo)
    const qrDataUrl = await QRCode.toDataURL(otpauthUrl)
    return { segredo, otpauthUrl, qrDataUrl }
  },

  async ativarTotp(id: string, segredo: string, codigo: string) {
    if (!authenticator.check(codigo, segredo)) {
      throw new UnauthorizedError('Código de verificação inválido')
    }
    return prisma.usuario.update({
      where: { id },
      data:  { totpSecret: segredo, totpAtivo: true },
      select: selectSemSenha,
    })
  },

  async desativarTotp(id: string) {
    return prisma.usuario.update({
      where: { id },
      data:  { totpSecret: null, totpAtivo: false },
      select: selectSemSenha,
    })
  },

  async verificarTotp(id: string, codigo: string) {
    const usuario = await prisma.usuario.findUnique({ where: { id } })
    if (!usuario?.totpSecret) return false
    return authenticator.check(codigo, usuario.totpSecret)
  },

  async listarOnline() {
    const limite = new Date(Date.now() - 15 * 60 * 1000)
    const sessoes = await prisma.sessaoAtiva.findMany({
      where: { revogadaEm: null, ultimoUso: { gte: limite } },
      include: { usuario: { select: { id: true, nome: true, papel: true, status: true } } },
      orderBy: { ultimoUso: 'desc' },
    })

    const vistos = new Set<string>()
    const online: { id: string; nome: string; papel: string; ultimoUso: Date }[] = []
    for (const s of sessoes) {
      if (!s.usuario || s.usuario.status !== 'Ativo' || vistos.has(s.usuario.id)) continue
      vistos.add(s.usuario.id)
      online.push({ id: s.usuario.id, nome: s.usuario.nome, papel: s.usuario.papel, ultimoUso: s.ultimoUso })
    }
    return online
  },

  async listarSessoes(usuarioId: string) {
    return prisma.sessaoAtiva.findMany({
      where:   { usuarioId, revogadaEm: null },
      orderBy: { ultimoUso: 'desc' },
    })
  },

  async encerrarSessao(usuarioId: string, sessaoId: string) {
    const sessao = await prisma.sessaoAtiva.findUnique({ where: { id: sessaoId } })
    if (!sessao || sessao.usuarioId !== usuarioId) throw new NotFoundError('Sessão não encontrada')
    return prisma.sessaoAtiva.update({ where: { id: sessaoId }, data: { revogadaEm: new Date() } })
  },
}