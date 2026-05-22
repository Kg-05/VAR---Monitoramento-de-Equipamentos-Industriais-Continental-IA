import 'module-alias/register'
import { app } from './app'
import { prisma } from './shared/database/prisma.client'

const PORT = process.env.PORT ?? 3333

async function main() {

  await prisma.$connect()
  console.log('✅ Base de dados ligada')

  app.listen(PORT, () => {
    console.log(`🚀 Servidor na porta ${PORT}`)
    console.log(`Ambiente: ${process.env.NODE_ENV ?? 'development'}`)
  })
}

main().catch((e) => {
  console.error('❌ Erro ao arrancar o servidor:', e)
  process.exit(1)
})