import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Pegue o email do usuário que quer elevar (substitua com seu email)
  const email = process.argv[2] || 'admin@kgtech.com'; // padrão do seed original

  console.log(`Elevando usuário com email: ${email} a ADMIN_CENTRAL...`);

  try {
    const usuario = await prisma.usuario.findFirst({
      where: { email }
    });

    if (!usuario) {
      console.error(`❌ Usuário com email ${email} não encontrado`);
      process.exit(1);
    }

    const usuarioAtualizado = await prisma.usuario.update({
      where: { id: usuario.id },
      data: { papel: 'ADMIN_CENTRAL' }
    });

    console.log(`✅ Usuário ${usuarioAtualizado.nome} elevado a ADMIN_CENTRAL com sucesso!`);
    console.log(`📧 Email: ${usuarioAtualizado.email}`);
    console.log(`👤 Papel: ${usuarioAtualizado.papel}`);
  } catch (error) {
    console.error('❌ Erro ao atualizar usuário:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
