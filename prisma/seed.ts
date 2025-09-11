import { PrismaClient, Papel, StatusLicenca, StatusPagamento, StatusEquipamento, SeveridadeAlerta, TipoLicenca } from '@prisma/client';
import bcrypt from 'bcrypt';
import { AppInfo } from '../src/config/admin';


const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed de dados...');

  
  // Criar Empresa de teste
  const empresa = await prisma.empresa.create({
    data: {
      nome: 'Empresa Teste S.A.',
      nif: '123456789',
      endereco: 'Rua Industrial, 1000',
      contacto: '+244900000000',
      email: 'contato@empresa-teste.com'
    }
  });

  // Criar Licença
  const licenca = await prisma.licenca.create({
    data: {
      empresaId: empresa.id,
      plano: TipoLicenca.BASICO,
      status: StatusLicenca.ATIVA,
      maxFuncionarios: 2,
      inicioEm: new Date(),
      expiraEm: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
    }
  });

  // Criar Pagamento
  await prisma.pagamento.create({
    data: {
      empresaId: empresa.id,
      licencaId: licenca.id,
      valor: 499.99,
      moeda: 'AOA',
      status: StatusPagamento.CONCLUIDO
    }
  });

  // Criar Administrador da Empresa
  const senhaAdminEmpresa = await bcrypt.hash('admin123', 10);
  const adminEmpresa = await prisma.usuario.create({
    data: {
      nome: 'Administrador Empresa',
      email: 'admin@empresa-teste.com',
      senhaHash: senhaAdminEmpresa,
      papel: Papel.ADMIN_EMPRESA,
      empresaId: empresa.id
    }
  });

  // Criar Funcionários
  const senhaFuncionario = await bcrypt.hash('func123', 10);
  const funcionarios = await prisma.usuario.createMany({
    data: [
      {
        nome: 'João Silva',
        email: 'joao@empresa-teste.com',
        senhaHash: senhaFuncionario,
        papel: Papel.FUNCIONARIO,
        empresaId: empresa.id
      },
      {
        nome: 'Maria Santos',
        email: 'maria@empresa-teste.com',
        senhaHash: senhaFuncionario,
        papel: Papel.FUNCIONARIO,
        empresaId: empresa.id
      }
    ]
  });

  // Criar Equipamentos e Dispositivos
  const equipamento1 = await prisma.equipamento.create({
    data: {
      empresaId: empresa.id,
      nome: 'Compressor Industrial X100',
      modelo: 'X100',
      numeroSerie: 'SN-001',
      localizacao: 'Setor 1',
      status: StatusEquipamento.OPERACIONAL
    }
  });

  const dispositivo1 = await prisma.dispositivo.create({
    data: {
      equipamentoId: equipamento1.id,
      nome: 'Câmera IP Principal',
      tipo: 'câmera',
      rtspUrl: 'rtsp://192.168.0.10:554/stream'
    }
  });

  const equipamento2 = await prisma.equipamento.create({
    data: {
      empresaId: empresa.id,
      nome: 'Gerador G500',
      modelo: 'G500',
      numeroSerie: 'SN-002',
      localizacao: 'Setor 2',
      status: StatusEquipamento.MANUTENCAO
    }
  });

  const dispositivo2 = await prisma.dispositivo.create({
    data: {
      equipamentoId: equipamento2.id,
      nome: 'Sensor de Vibração',
      tipo: 'sensor'
    }
  });

  // Criar Avaria
  const avaria = await prisma.avaria.create({
    data: {
      equipamentoId: equipamento1.id,
      dispositivoId: dispositivo1.id,
      descricao: 'Vibração excessiva detectada',
      confianca: 0.92,
      severidade: SeveridadeAlerta.ALTO
    }
  });

  // Criar Alerta
  await prisma.alerta.create({
    data: {
      avariaId: avaria.id,
      empresaId: empresa.id,
      mensagem: 'Atenção! Vibração anormal detectada no Compressor Industrial X100.',
      severidade: SeveridadeAlerta.MEDIO
    }
  });

  // Criar Log de Auditoria
  await prisma.log.create({
    data: {
      empresaId: empresa.id,
      usuarioId: adminEmpresa.id,
      nivel: 'INFO',
      acao: 'Seed inicial de dados',
      dados: { origem: 'seed.ts' }
    }
  });

  console.log('Seed concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });