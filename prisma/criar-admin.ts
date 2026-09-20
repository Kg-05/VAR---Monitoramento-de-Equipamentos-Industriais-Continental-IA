// prisma/criar-admin.ts
// Cria a primeira conta ADM Master de uma base de dados de produção,
// sem tocar em mais nenhum dado (ao contrário da seed, que apaga tudo
// e cria dados de demonstração). Nunca correr a seed contra produção.
//
// Uso: npx tsx prisma/criar-admin.ts <email> <nome> <senha>

import { PrismaClient, Papel } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const [email, nome, senha] = process.argv.slice(2)

  if (!email || !nome || !senha) {
    console.error('Uso: npx tsx prisma/criar-admin.ts <email> <nome> <senha>')
    process.exit(1)
  }
  if (senha.length < 8) {
    console.error('❌ A senha deve ter pelo menos 8 caracteres.')
    process.exit(1)
  }

  const existente = await prisma.usuario.findUnique({ where: { email } })
  if (existente) {
    console.error(`❌ Já existe um usuário com o email ${email}.`)
    process.exit(1)
  }

  const usuario = await prisma.usuario.create({
    data: {
      email,
      nome,
      senhaHash: await bcrypt.hash(senha, 10),
      papel: Papel.ADM,
    },
  })

  console.log('✅ Conta ADM Master criada com sucesso!')
  console.log(`   Nome:  ${usuario.nome}`)
  console.log(`   Email: ${usuario.email}`)
  console.log('   Guarda a senha em local seguro — não fica registada em lado nenhum.')
}

main()
  .catch((e) => {
    console.error('❌ Erro ao criar conta ADM:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
