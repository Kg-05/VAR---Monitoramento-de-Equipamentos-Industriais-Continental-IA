// 

import { app }   from './app'
import { prisma } from '@/shared/database/prisma.client'
import { execSync } from 'child_process'

const PORT = process.env.PORT ?? 3333

async function main() {
  // Corre as migrations antes de arrancar
  try {
    console.log('🔄 A aplicar migrations...')
    execSync('npx prisma migrate deploy', { stdio: 'inherit' })
    console.log('✅ Migrations aplicadas')
  } catch (e) {
    console.error('⚠️  Erro nas migrations:', e)
  }

  await prisma.$connect()
  console.log('✅ Base de dados ligada')

  app.listen(PORT, () => {
    console.log(`🚀 Servidor na porta ${PORT}`)
  })
}

main().catch((e) => {
  console.error('❌ Erro ao arrancar:', e)
  process.exit(1)
})