import { PrismaClient, Papel } from '@prisma/client';
import bcrypt from 'bcrypt';
import { AppInfo } from '../src/config/admin';


const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed de criação de Administrador Central...');

  // Criar Admin Central
  const adminSenha = await bcrypt.hash(AppInfo.admin.senha, 10);
  const admincentral = await prisma.usuario.create({
    data: {
      nome: AppInfo.admin.nome,
      email: AppInfo.admin.email,
      senhaHash: adminSenha,
      papel: Papel.ADMIN_CENTRAL,
      ativo: true
    }
  });
  console.log("Admin Central VAR criado com sucesso✅");
};



main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });