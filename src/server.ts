import { app } from './app'
import { prisma } from '@/shared/database/prisma.client'

const PORT = process.env.PORT ?? 3333

app.listen(PORT, () => {
  console.log(`
  
     VAR API              
     Servidor rodando na porta ${PORT}      
     http://localhost:${PORT}/api/v1        
     http://localhost:${PORT}/health
  `)
})

async function main() {
  await prisma.$connect() // falha aqui se a DB não estiver acessível
  app.listen(PORT, () => console.log(`Servidor na porta ${PORT}`))
}
main().catch((e) => { console.error(e); process.exit(1) })
