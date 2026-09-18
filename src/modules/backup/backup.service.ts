import { prisma } from '@/shared/database/prisma.client'

// Campos sensíveis nunca entram no backup (senhaHash, totpSecret).
const selectUsuario = {
  id: true, email: true, nome: true, papel: true, status: true,
  empresaId: true, criadoEm: true, updatedAt: true, avatarUrl: true,
  notificacaoEmailAtiva: true,
} as const

export const BackupService = {
  async exportar() {
    const [empresas, usuarios, funcionarios, equipamentos, licencas, pagamentos, documentos, alertas] =
      await prisma.$transaction([
        prisma.empresa.findMany(),
        prisma.usuario.findMany({ select: selectUsuario }),
        prisma.funcionario.findMany(),
        prisma.equipamento.findMany(),
        prisma.licenca.findMany(),
        prisma.pagamento.findMany(),
        prisma.documento.findMany(),
        prisma.alerta.findMany(),
      ])

    return {
      geradoEm: new Date().toISOString(),
      versao:   1,
      dados: { empresas, usuarios, funcionarios, equipamentos, licencas, pagamentos, documentos, alertas },
    }
  },

  async restaurar(backup: any) {
    const d = backup?.dados
    if (!d) throw new Error('Ficheiro de backup inválido')

    await prisma.$transaction(async (tx) => {
      for (const e of d.empresas ?? []) {
        await tx.empresa.upsert({ where: { id: e.id }, update: e, create: e })
      }
      for (const u of d.usuarios ?? []) {
        // Utilizadores restaurados ficam sem senha definida (senhaHash placeholder) —
        // nunca restauramos hashes de senha por backup.
        const { senhaHash: _placeholder, ...resto } = u
        await tx.usuario.upsert({
          where: { id: u.id },
          update: resto,
          create: { ...resto, senhaHash: '' },
        })
      }
      for (const f of d.funcionarios ?? []) {
        await tx.funcionario.upsert({ where: { id: f.id }, update: f, create: f })
      }
      for (const eq of d.equipamentos ?? []) {
        await tx.equipamento.upsert({ where: { id: eq.id }, update: eq, create: eq })
      }
      for (const l of d.licencas ?? []) {
        await tx.licenca.upsert({ where: { id: l.id }, update: l, create: l })
      }
      for (const p of d.pagamentos ?? []) {
        await tx.pagamento.upsert({ where: { id: p.id }, update: p, create: p })
      }
      for (const doc of d.documentos ?? []) {
        await tx.documento.upsert({ where: { id: doc.id }, update: doc, create: doc })
      }
      for (const a of d.alertas ?? []) {
        await tx.alerta.upsert({ where: { id: a.id }, update: a, create: a })
      }
    })

    return { restaurado: true }
  },
}
