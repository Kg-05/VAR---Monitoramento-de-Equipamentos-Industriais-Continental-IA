// =============================================================
// prisma/seed.ts — Dados iniciais do sistema
// Execução: npx tsx prisma/seed.ts  ou  npm run db:seed
// =============================================================

import { PrismaClient, Papel, PlanoLicenca, StatusEquipamento, NivelAlerta, StatusPagamento, StatusFuncionario } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// =============================================================
// HELPERS
// =============================================================

async function hashSenha(senha: string): Promise<string> {
  return bcrypt.hash(senha, 10)
}

function adicionarDias(data: Date, dias: number): Date {
  const resultado = new Date(data)
  resultado.setDate(resultado.getDate() + dias)
  return resultado
}

// =============================================================
// LIMPEZA (ordem importa por causa das FK)
// =============================================================

async function limpar() {
  console.log('🗑️  Limpando banco de dados...')
  await prisma.log.deleteMany()
  await prisma.alerta.deleteMany()
  await prisma.equipamento.deleteMany()
  await prisma.funcionario.deleteMany()
  await prisma.pagamento.deleteMany()
  await prisma.licenca.deleteMany()
  await prisma.usuario.deleteMany()
  await prisma.empresa.deleteMany()
  console.log('   Concluído.\n')
}

// =============================================================
// SEED PRINCIPAL
// =============================================================

async function main() {
  await limpar()

  const agora = new Date()

  // -----------------------------------------------------------
  // 1. USUÁRIO ADM MASTER
  // Acesso total ao sistema, sem empresa vinculada.
  // -----------------------------------------------------------
  console.log('👤 Criando usuário ADM master...')

  const adm = await prisma.usuario.create({
    data: {
      email:     'admin@kgtech.com',
      nome:      'Administrador Master',
      senhaHash: await hashSenha('Admin@123'),
      papel:     Papel.ADM,
    },
  })

  console.log(`   ✓ ${adm.nome} — ${adm.email}\n`)

  // -----------------------------------------------------------
  // 2. USUÁRIO OPERACIONAL
  // Gere clientes e licenças, sem empresa vinculada.
  // -----------------------------------------------------------
  console.log('👤 Criando usuário Operacional...')

  const operacional = await prisma.usuario.create({
    data: {
      email:     'operacional@sistema.ao',
      nome:      'Gestor Operacional',
      senhaHash: await hashSenha('Oper@123'),
      papel:     Papel.Operacional,
    },
  })

  console.log(`   ✓ ${operacional.nome} — ${operacional.email}\n`)

  // -----------------------------------------------------------
  // 3. EMPRESA A — Plano Premium (licença activa)
  // -----------------------------------------------------------
  console.log('🏭 Criando Empresa A (Premium)...')

  const empresaA = await prisma.empresa.create({
    data: {
      nome:     'Sonangol Refinaria Luanda',
      cnpj:     '00.000.000/0001-01',
      email:    'ti@sonangol-refinaria.ao',
      telefone: '+244 222 000 001',
    },
  })

  const licencaA = await prisma.licenca.create({
    data: {
      plano:            PlanoLicenca.Premium,
      maxDeFuncionarios: 100,
      inicioEm:         agora,
      expiraEm:         adicionarDias(agora, 365),
      empresaId:        empresaA.id,
    },
  })

  await prisma.pagamento.create({
    data: {
      valor:     250000.00,
      moeda:     'AOA',
      status:    StatusPagamento.Concluido,
      referencia: 'REF-2024-001',
      empresaId: empresaA.id,
      licencaId: licencaA.id,
    },
  })

  const clienteA = await prisma.usuario.create({
    data: {
      email:     'gestor@sonangol-refinaria.ao',
      nome:      'Carlos Mendes',
      senhaHash: await hashSenha('Cliente@123'),
      papel:     Papel.Cliente,
      empresaId: empresaA.id,
    },
  })

  console.log(`   ✓ ${empresaA.nome}`)
  console.log(`     Licença: ${licencaA.plano} — expira em ${licencaA.expiraEm.toLocaleDateString('pt-PT')}`)
  console.log(`     Usuário cliente: ${clienteA.email}\n`)

  // -----------------------------------------------------------
  // 4. FUNCIONÁRIOS da Empresa A
  // -----------------------------------------------------------
  console.log('👷 Criando funcionários da Empresa A...')

  const funcionariosA = await prisma.funcionario.createManyAndReturn({
    data: [
      { nome: 'António Sebastião', email: 'a.sebastiao@sonangol-refinaria.ao', cargo: 'Engenheiro de Manutenção', telefone: '+244 923 000 001', status: StatusFuncionario.Ativo,   empresaId: empresaA.id },
      { nome: 'Maria da Conceição', email: 'm.conceicao@sonangol-refinaria.ao', cargo: 'Técnica de Instrumentação', telefone: '+244 923 000 002', status: StatusFuncionario.Ativo,   empresaId: empresaA.id },
      { nome: 'João Baptista',     email: 'j.baptista@sonangol-refinaria.ao',  cargo: 'Operador de Campo',        telefone: '+244 923 000 003', status: StatusFuncionario.Pendente, empresaId: empresaA.id },
    ],
  })

  console.log(`   ✓ ${funcionariosA.length} funcionários criados\n`)

  // -----------------------------------------------------------
  // 5. EQUIPAMENTOS da Empresa A
  // -----------------------------------------------------------
  console.log('⚙️  Criando equipamentos da Empresa A...')

  const [bombaA, compressorA, valvulaA] = await Promise.all([
    prisma.equipamento.create({ data: {
      nome:        'Bomba Centrífuga BC-01',
      modelo:      'Grundfos CR 64-3',
      fabricante:  'Grundfos',
      numeroSerie: 'GF-2021-BC01',
      localizacao: 'Unidade de Destilação — Piso 1',
      status:      StatusEquipamento.Operacional,
      empresaId:   empresaA.id,
    }}),
    prisma.equipamento.create({ data: {
      nome:        'Compressor de Ar CA-03',
      modelo:      'Atlas Copco GA 55',
      fabricante:  'Atlas Copco',
      numeroSerie: 'AC-2020-CA03',
      localizacao: 'Casa de Compressores — Bloco B',
      status:      StatusEquipamento.Manutencao,
      empresaId:   empresaA.id,
    }}),
    prisma.equipamento.create({ data: {
      nome:        'Válvula de Controlo VC-07',
      modelo:      'Fisher 667',
      fabricante:  'Emerson',
      numeroSerie: 'EM-2022-VC07',
      localizacao: 'Linha de Processo — Sector 3',
      status:      StatusEquipamento.Operacional,
      empresaId:   empresaA.id,
    }}),
  ])

  console.log(`   ✓ 3 equipamentos criados\n`)

  // -----------------------------------------------------------
  // 6. ALERTAS da Empresa A
  // -----------------------------------------------------------
  console.log('🚨 Criando alertas da Empresa A...')

  await prisma.alerta.createMany({
    data: [
      {
        descricao:    'Temperatura acima do limite operacional — 92°C (limite: 85°C)',
        nivel:        NivelAlerta.critico,
        empresaId:    empresaA.id,
        equipamentoId: compressorA.id,
        // não lido — lidoPorId e lidoEm null
      },
      {
        descricao:    'Vibração anormal detectada — 8.2 mm/s (limite: 7.1 mm/s)',
        nivel:        NivelAlerta.medio,
        empresaId:    empresaA.id,
        equipamentoId: bombaA.id,
        lidoPorId:    clienteA.id,
        lidoEm:       new Date(),
      },
      {
        descricao:    'Pressão diferencial levemente elevada — monitorar nas próximas 24h',
        nivel:        NivelAlerta.razoavel,
        empresaId:    empresaA.id,
        equipamentoId: valvulaA.id,
      },
    ],
  })

  console.log(`   ✓ 3 alertas criados (1 crítico, 1 médio, 1 razoável)\n`)

  // -----------------------------------------------------------
  // 7. EMPRESA B — Plano Básico (licença a expirar em 7 dias)
  // -----------------------------------------------------------
  console.log('🏭 Criando Empresa B (Básico — a expirar)...')

  const empresaB = await prisma.empresa.create({
    data: {
      nome:     'TAAG Manutenção Técnica',
      cnpj:     '00.000.000/0001-02',
      email:    'manutencao@taag.ao',
      telefone: '+244 222 000 002',
    },
  })

  const licencaB = await prisma.licenca.create({
    data: {
      plano:            PlanoLicenca.Basico,
      maxDeFuncionarios: 10,
      inicioEm:         adicionarDias(agora, -358),
      expiraEm:         adicionarDias(agora, 7),   // expira em 7 dias
      empresaId:        empresaB.id,
    },
  })

  await prisma.pagamento.create({
    data: {
      valor:     45000.00,
      moeda:     'AOA',
      status:    StatusPagamento.Concluido,
      referencia: 'REF-2024-002',
      empresaId: empresaB.id,
      licencaId: licencaB.id,
    },
  })

  const clienteB = await prisma.usuario.create({
    data: {
      email:     'gestor@taag-manutencao.ao',
      nome:      'Esperança Neto',
      senhaHash: await hashSenha('Cliente@123'),
      papel:     Papel.Cliente,
      empresaId: empresaB.id,
    },
  })

  await prisma.funcionario.createMany({
    data: [
      { nome: 'Rui Pacheco',   email: 'r.pacheco@taag.ao',  cargo: 'Mecânico Aeronáutico', status: StatusFuncionario.Ativo, empresaId: empresaB.id },
      { nome: 'Luísa Amaral',  email: 'l.amaral@taag.ao',   cargo: 'Técnica Electrónica',  status: StatusFuncionario.Ativo, empresaId: empresaB.id },
    ],
  })

  const turbina = await prisma.equipamento.create({ data: {
    nome:        'Turbina TF-12',
    modelo:      'CFM56-5B',
    fabricante:  'CFM International',
    numeroSerie: 'CFM-2019-TF12',
    localizacao: 'Hangar 3 — Baia A',
    status:      StatusEquipamento.Operacional,
    empresaId:   empresaB.id,
  }})

  await prisma.alerta.create({ data: {
    descricao:    'Desgaste acima do esperado nas pás do estágio 2',
    nivel:        NivelAlerta.medio,
    empresaId:    empresaB.id,
    equipamentoId: turbina.id,
  }})

  console.log(`   ✓ ${empresaB.nome}`)
  console.log(`     Licença: ${licencaB.plano} — expira em ${licencaB.expiraEm.toLocaleDateString('pt-PT')} (⚠️  7 dias)`)
  console.log(`     Usuário cliente: ${clienteB.email}\n`)

  // -----------------------------------------------------------
  // 8. EMPRESA C — Plano Profissional (licença suspensa)
  // -----------------------------------------------------------
  console.log('🏭 Criando Empresa C (Profissional — suspensa)...')

  const empresaC = await prisma.empresa.create({
    data: {
      nome:     'Endiama Processamento',
      cnpj:     '00.000.000/0001-03',
      email:    'sistemas@endiama-proc.ao',
      telefone: '+244 222 000 003',
    },
  })

  const licencaC = await prisma.licenca.create({
    data: {
      plano:            PlanoLicenca.Profissional,
      status:           'Suspensa',
      maxDeFuncionarios: 30,
      inicioEm:         adicionarDias(agora, -90),
      expiraEm:         adicionarDias(agora, 275),
      observacoes:      'Suspensa por falta de pagamento da 2ª parcela.',
      empresaId:        empresaC.id,
    },
  })

  // Pagamento pendente (em atraso)
  await prisma.pagamento.create({
    data: {
      valor:     120000.00,
      moeda:     'AOA',
      status:    StatusPagamento.Pendente,
      referencia: 'REF-2024-003',
      empresaId: empresaC.id,
      licencaId: licencaC.id,
    },
  })

  await prisma.usuario.create({
    data: {
      email:     'gestor@endiama-proc.ao',
      nome:      'Filipe Carvalho',
      senhaHash: await hashSenha('Cliente@123'),
      papel:     Papel.Cliente,
      empresaId: empresaC.id,
    },
  })

  console.log(`   ✓ ${empresaC.nome}`)
  console.log(`     Licença: ${licencaC.plano} — SUSPENSA (pagamento pendente)\n`)

  // -----------------------------------------------------------
  // 9. RESUMO FINAL
  // -----------------------------------------------------------
  const totais = await Promise.all([
    prisma.empresa.count(),
    prisma.usuario.count(),
    prisma.funcionario.count(),
    prisma.equipamento.count(),
    prisma.alerta.count(),
    prisma.licenca.count(),
    prisma.pagamento.count(),
  ])

  console.log('═══════════════════════════════════════')
  console.log('✅  Seed concluído com sucesso!')
  console.log('═══════════════════════════════════════')
  console.log(`   Empresas:     ${totais[0]}`)
  console.log(`   Usuários:     ${totais[1]}  (1 ADM · 1 Operacional · 3 Clientes)`)
  console.log(`   Funcionários: ${totais[2]}`)
  console.log(`   Equipamentos: ${totais[3]}`)
  console.log(`   Alertas:      ${totais[4]}`)
  console.log(`   Licenças:     ${totais[5]}  (1 activa · 1 a expirar · 1 suspensa)`)
  console.log(`   Pagamentos:   ${totais[6]}`)
  console.log('═══════════════════════════════════════')
  console.log()
  console.log('🔑 Credenciais de acesso:')
  console.log('   ADM          → adm@sistema.ao           / Admin@123')
  console.log('   Operacional  → operacional@sistema.ao   / Oper@123')
  console.log('   Cliente A    → gestor@sonangol-refinaria.ao / Cliente@123')
  console.log('   Cliente B    → gestor@taag-manutencao.ao   / Cliente@123')
  console.log('   Cliente C    → gestor@endiama-proc.ao       / Cliente@123')
  console.log()
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
