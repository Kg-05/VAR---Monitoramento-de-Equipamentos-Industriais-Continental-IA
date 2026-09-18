import { prisma } from '@/shared/database/prisma.client'

export const PlataformaService = {
  async obter() {
    return prisma.plataformaConfig.upsert({
      where:  { id: 'default' },
      update: {},
      create: { id: 'default' },
    })
  },

  async atualizar(data: { nome?: string; idioma?: string }) {
    await PlataformaService.obter()
    return prisma.plataformaConfig.update({ where: { id: 'default' }, data })
  },

  async atualizarLogotipo(logotipoUrl: string) {
    await PlataformaService.obter()
    return prisma.plataformaConfig.update({ where: { id: 'default' }, data: { logotipoUrl } })
  },
}
