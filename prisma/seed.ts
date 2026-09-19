// =============================================================
// prisma/seed.ts — Dados iniciais do sistema
// Execução: npx tsx prisma/seed.ts  ou  npm run db:seed
// =============================================================

import { PrismaClient, Papel, PlanoLicenca, StatusLicenca, StatusEquipamento, NivelAlerta, StatusPagamento, StatusFuncionario, StatusDocumento } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// =============================================================
// HELPERS
// =============================================================

async function hashSenha(senha: string): Promise<string> {
  return bcrypt.hash(senha, 10)
}

const agora = new Date()

function comData(dias: number, hora = 9, minuto = 0): Date {
  const resultado = new Date(agora)
  resultado.setDate(resultado.getDate() + dias)
  resultado.setHours(hora, minuto, 0, 0)
  return resultado
}

// =============================================================
// TIPOS DOS DADOS DE SEED
// =============================================================

interface FuncionarioSpec {
  nome: string
  email: string
  cargo: string
  telefone?: string
  status?: StatusFuncionario
}

interface EquipamentoSpec {
  nome: string
  modelo: string
  fabricante?: string
  numeroSerie?: string
  localizacao: string
  status?: StatusEquipamento
}

interface AlertaSpec {
  descricao: string
  nivel: NivelAlerta
  equipamentoIndex: number
  diasAtras: number
  lida?: boolean // se true, marca lidoPorId = cliente da empresa
}

interface LicencaSpec {
  plano: PlanoLicenca
  status?: StatusLicenca
  maxDeFuncionarios: number
  inicioDiasAtras: number
  expiraEmDias: number
  observacoes?: string
}

interface PagamentoSpec {
  licencaIndex: number
  valor: number
  status: StatusPagamento
  referencia?: string
  diasAtras: number
}

interface DocumentoSpec {
  nomeArquivo: string
  status?: StatusDocumento
  diasAtras: number
}

interface EmpresaSpec {
  nome: string
  cnpj: string
  email: string
  telefone: string
  clienteNome: string
  clienteEmail: string
  licencas: LicencaSpec[]
  pagamentos: PagamentoSpec[]
  funcionarios: FuncionarioSpec[]
  equipamentos: EquipamentoSpec[]
  alertas: AlertaSpec[]
  documentos: DocumentoSpec[]
}

const SENHA_PADRAO = 'Cliente@123'

// =============================================================
// DADOS: 8 EMPRESAS, sectores industriais variados
// =============================================================

const empresasSpec: EmpresaSpec[] = [
  // ---------------------------------------------------------
  // 1. Sonangol Refinaria Luanda — Petróleo & Gás (Premium, activa)
  // ---------------------------------------------------------
  {
    nome: 'Sonangol Refinaria Luanda',
    cnpj: '00.000.000/0001-01',
    email: 'ti@sonangol-refinaria.ao',
    telefone: '+244 222 000 001',
    clienteNome: 'Carlos Mendes',
    clienteEmail: 'gestor@sonangol-refinaria.ao',
    licencas: [
      { plano: PlanoLicenca.Premium, maxDeFuncionarios: 100, inicioDiasAtras: 365, expiraEmDias: 365 },
    ],
    pagamentos: [
      { licencaIndex: 0, valor: 250000, status: StatusPagamento.Concluido, referencia: 'REF-2024-001', diasAtras: 365 },
      { licencaIndex: 0, valor: 250000, status: StatusPagamento.Concluido, referencia: 'REF-2025-011', diasAtras: 60 },
    ],
    funcionarios: [
      { nome: 'António Sebastião', email: 'a.sebastiao@sonangol-refinaria.ao', cargo: 'Engenheiro de Manutenção', telefone: '+244 923 000 001', status: StatusFuncionario.Ativo },
      { nome: 'Maria da Conceição', email: 'm.conceicao@sonangol-refinaria.ao', cargo: 'Técnica de Instrumentação', telefone: '+244 923 000 002', status: StatusFuncionario.Ativo },
      { nome: 'João Baptista', email: 'j.baptista@sonangol-refinaria.ao', cargo: 'Operador de Campo', telefone: '+244 923 000 003', status: StatusFuncionario.Pendente },
      { nome: 'Isabel Neves', email: 'i.neves@sonangol-refinaria.ao', cargo: 'Engenheira de Processos', telefone: '+244 923 000 004', status: StatusFuncionario.Ativo },
      { nome: 'Domingos Kiala', email: 'd.kiala@sonangol-refinaria.ao', cargo: 'Técnico de Segurança Industrial', telefone: '+244 923 000 005', status: StatusFuncionario.Ativo },
      { nome: 'Paula Ferreira', email: 'p.ferreira@sonangol-refinaria.ao', cargo: 'Supervisora de Turno', status: StatusFuncionario.Inativo },
    ],
    equipamentos: [
      { nome: 'Bomba Centrífuga BC-01', modelo: 'Grundfos CR 64-3', fabricante: 'Grundfos', numeroSerie: 'GF-2021-BC01', localizacao: 'Unidade de Destilação — Piso 1', status: StatusEquipamento.Operacional },
      { nome: 'Compressor de Ar CA-03', modelo: 'Atlas Copco GA 55', fabricante: 'Atlas Copco', numeroSerie: 'AC-2020-CA03', localizacao: 'Casa de Compressores — Bloco B', status: StatusEquipamento.Manutencao },
      { nome: 'Válvula de Controlo VC-07', modelo: 'Fisher 667', fabricante: 'Emerson', numeroSerie: 'EM-2022-VC07', localizacao: 'Linha de Processo — Sector 3', status: StatusEquipamento.Operacional },
      { nome: 'Caldeira Industrial CI-02', modelo: 'Bosch UT-L', fabricante: 'Bosch', numeroSerie: 'BS-2019-CI02', localizacao: 'Sala de Caldeiras — Bloco A', status: StatusEquipamento.Operacional },
      { nome: 'Tanque de Armazenamento TQ-15', modelo: 'API 650', fabricante: 'Belleli', numeroSerie: 'BL-2018-TQ15', localizacao: 'Parque de Tanques — Sector 2', status: StatusEquipamento.Operacional },
      { nome: 'Torre de Destilação TD-01', modelo: 'Fractionation X200', fabricante: 'Technip', numeroSerie: 'TP-2017-TD01', localizacao: 'Unidade de Destilação — Piso 3', status: StatusEquipamento.Manutencao },
    ],
    alertas: [
      { descricao: 'Temperatura acima do limite operacional — 92°C (limite: 85°C)', nivel: NivelAlerta.critico, equipamentoIndex: 1, diasAtras: 0 },
      { descricao: 'Vibração anormal detectada — 8.2 mm/s (limite: 7.1 mm/s)', nivel: NivelAlerta.medio, equipamentoIndex: 0, diasAtras: 1, lida: true },
      { descricao: 'Pressão diferencial levemente elevada — monitorar nas próximas 24h', nivel: NivelAlerta.razoavel, equipamentoIndex: 2, diasAtras: 2 },
      { descricao: 'Fuga de vapor detectada na junta de flange principal', nivel: NivelAlerta.critico, equipamentoIndex: 3, diasAtras: 3 },
      { descricao: 'Nível de combustível abaixo do recomendado', nivel: NivelAlerta.medio, equipamentoIndex: 4, diasAtras: 5, lida: true },
      { descricao: 'Ruído incomum no motor durante arranque', nivel: NivelAlerta.razoavel, equipamentoIndex: 5, diasAtras: 6 },
      { descricao: 'Filtro de ar com obstrução parcial — 68% de saturação', nivel: NivelAlerta.razoavel, equipamentoIndex: 1, diasAtras: 8, lida: true },
      { descricao: 'Parada não programada por sobreaquecimento', nivel: NivelAlerta.critico, equipamentoIndex: 5, diasAtras: 10 },
      { descricao: 'Corrosão superficial identificada na base do tanque', nivel: NivelAlerta.medio, equipamentoIndex: 4, diasAtras: 13, lida: true },
      { descricao: 'Sensor de nível com leitura instável', nivel: NivelAlerta.razoavel, equipamentoIndex: 0, diasAtras: 17 },
    ],
    documentos: [
      { nomeArquivo: 'certificado_seguranca_2026.pdf', status: StatusDocumento.Lido, diasAtras: 40 },
      { nomeArquivo: 'relatorio_inspecao_caldeiras.pdf', status: StatusDocumento.NaoLido, diasAtras: 5 },
      { nomeArquivo: 'comprovativo_pagamento_2025.pdf', status: StatusDocumento.Arquivado, diasAtras: 90 },
    ],
  },

  // ---------------------------------------------------------
  // 2. TAAG Manutenção Técnica — Aviação (Básico, a expirar)
  // ---------------------------------------------------------
  {
    nome: 'TAAG Manutenção Técnica',
    cnpj: '00.000.000/0001-02',
    email: 'manutencao@taag.ao',
    telefone: '+244 222 000 002',
    clienteNome: 'Esperança Neto',
    clienteEmail: 'gestor@taag-manutencao.ao',
    licencas: [
      { plano: PlanoLicenca.Basico, maxDeFuncionarios: 10, inicioDiasAtras: 358, expiraEmDias: 7 },
    ],
    pagamentos: [
      { licencaIndex: 0, valor: 45000, status: StatusPagamento.Concluido, referencia: 'REF-2024-002', diasAtras: 358 },
    ],
    funcionarios: [
      { nome: 'Rui Pacheco', email: 'r.pacheco@taag.ao', cargo: 'Mecânico Aeronáutico', status: StatusFuncionario.Ativo },
      { nome: 'Luísa Amaral', email: 'l.amaral@taag.ao', cargo: 'Técnica Electrónica', status: StatusFuncionario.Ativo },
      { nome: 'Manuel Gonga', email: 'm.gonga@taag.ao', cargo: 'Técnico de Aviónicos', telefone: '+244 924 000 001', status: StatusFuncionario.Ativo },
      { nome: 'Ana Kiesse', email: 'a.kiesse@taag.ao', cargo: 'Supervisora de Manutenção', telefone: '+244 924 000 002', status: StatusFuncionario.Pendente },
    ],
    equipamentos: [
      { nome: 'Turbina TF-12', modelo: 'CFM56-5B', fabricante: 'CFM International', numeroSerie: 'CFM-2019-TF12', localizacao: 'Hangar 3 — Baia A', status: StatusEquipamento.Operacional },
      { nome: 'Trem de Pouso TP-05', modelo: 'Messier-Bugatti B737', fabricante: 'Safran', numeroSerie: 'SF-2018-TP05', localizacao: 'Hangar 3 — Baia B', status: StatusEquipamento.Manutencao },
      { nome: 'Sistema Hidráulico SH-08', modelo: 'Parker HYD-X', fabricante: 'Parker Hannifin', numeroSerie: 'PH-2020-SH08', localizacao: 'Hangar 2 — Oficina', status: StatusEquipamento.Operacional },
      { nome: 'Radar de Bordo RB-02', modelo: 'Honeywell RDR-4000', fabricante: 'Honeywell', numeroSerie: 'HW-2021-RB02', localizacao: 'Hangar 3 — Baia A', status: StatusEquipamento.Operacional },
    ],
    alertas: [
      { descricao: 'Desgaste acima do esperado nas pás do estágio 2', nivel: NivelAlerta.medio, equipamentoIndex: 0, diasAtras: 1 },
      { descricao: 'Pressão hidráulica abaixo do mínimo de segurança', nivel: NivelAlerta.critico, equipamentoIndex: 2, diasAtras: 2 },
      { descricao: 'Folga excessiva detectada no amortecedor principal', nivel: NivelAlerta.razoavel, equipamentoIndex: 1, diasAtras: 4, lida: true },
      { descricao: 'Falha intermitente no sinal do transponder', nivel: NivelAlerta.medio, equipamentoIndex: 3, diasAtras: 9 },
    ],
    documentos: [
      { nomeArquivo: 'certificado_aeronavegabilidade.pdf', status: StatusDocumento.Lido, diasAtras: 20 },
      { nomeArquivo: 'fatura_licenca_basico.pdf', status: StatusDocumento.NaoLido, diasAtras: 3 },
    ],
  },

  // ---------------------------------------------------------
  // 3. Endiama Processamento — Mineração (Profissional, suspensa)
  // ---------------------------------------------------------
  {
    nome: 'Endiama Processamento',
    cnpj: '00.000.000/0001-03',
    email: 'sistemas@endiama-proc.ao',
    telefone: '+244 222 000 003',
    clienteNome: 'Filipe Carvalho',
    clienteEmail: 'gestor@endiama-proc.ao',
    licencas: [
      { plano: PlanoLicenca.Profissional, status: StatusLicenca.Suspensa, maxDeFuncionarios: 30, inicioDiasAtras: 90, expiraEmDias: 275, observacoes: 'Suspensa por falta de pagamento da 2ª parcela.' },
    ],
    pagamentos: [
      { licencaIndex: 0, valor: 120000, status: StatusPagamento.Pendente, referencia: 'REF-2024-003', diasAtras: 90 },
    ],
    funcionarios: [
      { nome: 'Joaquim Sacaia', email: 'j.sacaia@endiama-proc.ao', cargo: 'Geólogo de Campo', telefone: '+244 925 000 001', status: StatusFuncionario.Ativo },
      { nome: 'Beatriz Muxito', email: 'b.muxito@endiama-proc.ao', cargo: 'Operadora de Britagem', telefone: '+244 925 000 002', status: StatusFuncionario.Ativo },
      { nome: 'Nelson Capemba', email: 'n.capemba@endiama-proc.ao', cargo: 'Técnico de Manutenção', status: StatusFuncionario.Pendente },
      { nome: 'Sandra Vieira', email: 's.vieira@endiama-proc.ao', cargo: 'Supervisora de Segurança', status: StatusFuncionario.Ativo },
    ],
    equipamentos: [
      { nome: 'Britador Primário BP-01', modelo: 'Metso C160', fabricante: 'Metso', numeroSerie: 'MT-2016-BP01', localizacao: 'Planta de Britagem — Sector 1', status: StatusEquipamento.Operacional },
      { nome: 'Peneira Vibratória PV-04', modelo: 'Sandvik SB6203', fabricante: 'Sandvik', numeroSerie: 'SV-2017-PV04', localizacao: 'Planta de Britagem — Sector 2', status: StatusEquipamento.Manutencao },
      { nome: 'Correia Transportadora CT-09', modelo: 'ContiTech HR-800', fabricante: 'ContiTech', numeroSerie: 'CT-2019-CT09', localizacao: 'Linha de Transporte — Sector 3', status: StatusEquipamento.Operacional },
      { nome: 'Separador Magnético SM-02', modelo: 'Eriez HGMS', fabricante: 'Eriez', numeroSerie: 'ER-2020-SM02', localizacao: 'Planta de Processamento — Sector 4', status: StatusEquipamento.Operacional },
    ],
    alertas: [
      { descricao: 'Sobrecarga detectada no motor do britador', nivel: NivelAlerta.critico, equipamentoIndex: 0, diasAtras: 0 },
      { descricao: 'Desalinhamento na correia transportadora', nivel: NivelAlerta.medio, equipamentoIndex: 2, diasAtras: 3, lida: true },
      { descricao: 'Vibração excessiva na peneira vibratória', nivel: NivelAlerta.razoavel, equipamentoIndex: 1, diasAtras: 7 },
      { descricao: 'Perda de eficiência no separador magnético — 74%', nivel: NivelAlerta.medio, equipamentoIndex: 3, diasAtras: 12 },
      { descricao: 'Ruído metálico anómalo durante operação', nivel: NivelAlerta.razoavel, equipamentoIndex: 0, diasAtras: 18, lida: true },
    ],
    documentos: [
      { nomeArquivo: 'aviso_suspensao_licenca.pdf', status: StatusDocumento.NaoLido, diasAtras: 8 },
    ],
  },

  // ---------------------------------------------------------
  // 4. Unitel S.A. — Telecomunicações (Profissional, activa)
  // ---------------------------------------------------------
  {
    nome: 'Unitel S.A.',
    cnpj: '00.000.000/0001-04',
    email: 'ti@unitel.co.ao',
    telefone: '+244 222 000 004',
    clienteNome: 'Ricardo Bumba',
    clienteEmail: 'gestor@unitel.co.ao',
    licencas: [
      { plano: PlanoLicenca.Profissional, maxDeFuncionarios: 30, inicioDiasAtras: 200, expiraEmDias: 165 },
    ],
    pagamentos: [
      { licencaIndex: 0, valor: 120000, status: StatusPagamento.Concluido, referencia: 'REF-2025-004', diasAtras: 200 },
    ],
    funcionarios: [
      { nome: 'Hélder Ventura', email: 'h.ventura@unitel.co.ao', cargo: 'Técnico de Rede', telefone: '+244 926 000 001', status: StatusFuncionario.Ativo },
      { nome: 'Cátia Domingos', email: 'c.domingos@unitel.co.ao', cargo: 'Engenheira de Telecomunicações', telefone: '+244 926 000 002', status: StatusFuncionario.Ativo },
      { nome: 'Wilson Paca', email: 'w.paca@unitel.co.ao', cargo: 'Técnico de Datacenter', status: StatusFuncionario.Ativo },
      { nome: 'Ivone Sozinho', email: 'i.sozinho@unitel.co.ao', cargo: 'Supervisora de Manutenção', status: StatusFuncionario.Pendente },
      { nome: 'Bruno Kalunga', email: 'b.kalunga@unitel.co.ao', cargo: 'Técnico de Antenas', status: StatusFuncionario.Inativo },
    ],
    equipamentos: [
      { nome: 'Antena Setorial AS-11', modelo: 'Huawei ATR4518', fabricante: 'Huawei', numeroSerie: 'HW-2022-AS11', localizacao: 'Torre — Sector Central', status: StatusEquipamento.Operacional },
      { nome: 'Gerador Diesel GD-06', modelo: 'Cummins C150D5', fabricante: 'Cummins', numeroSerie: 'CM-2020-GD06', localizacao: 'Estação — Sala Técnica', status: StatusEquipamento.Operacional },
      { nome: 'Ar Condicionado Datacenter AC-DC1', modelo: 'Stulz CyberAir 3', fabricante: 'Stulz', numeroSerie: 'ST-2021-DC01', localizacao: 'Datacenter — Piso 1', status: StatusEquipamento.Manutencao },
      { nome: 'Servidor Core SRV-03', modelo: 'Dell PowerEdge R750', fabricante: 'Dell', numeroSerie: 'DL-2023-SR03', localizacao: 'Datacenter — Rack 4', status: StatusEquipamento.Operacional },
      { nome: 'Rectificador de Energia RT-02', modelo: 'Delta Eltek Flatpack2', fabricante: 'Delta', numeroSerie: 'DT-2019-RT02', localizacao: 'Estação — Sala de Energia', status: StatusEquipamento.Operacional },
    ],
    alertas: [
      { descricao: 'Temperatura elevada no datacenter — 29°C (limite: 24°C)', nivel: NivelAlerta.critico, equipamentoIndex: 2, diasAtras: 0 },
      { descricao: 'Perda de sinal intermitente no sector central', nivel: NivelAlerta.medio, equipamentoIndex: 0, diasAtras: 1, lida: true },
      { descricao: 'Nível de combustível do gerador abaixo de 20%', nivel: NivelAlerta.medio, equipamentoIndex: 1, diasAtras: 4 },
      { descricao: 'Uso de CPU do servidor acima de 90% sustentado', nivel: NivelAlerta.razoavel, equipamentoIndex: 3, diasAtras: 6, lida: true },
      { descricao: 'Tensão de saída instável no rectificador', nivel: NivelAlerta.razoavel, equipamentoIndex: 4, diasAtras: 15 },
    ],
    documentos: [
      { nomeArquivo: 'contrato_manutencao_2026.pdf', status: StatusDocumento.Lido, diasAtras: 30 },
      { nomeArquivo: 'relatorio_rede_trimestral.pdf', status: StatusDocumento.NaoLido, diasAtras: 2 },
    ],
  },

  // ---------------------------------------------------------
  // 5. Banco BAI — Banca (Premium, activa)
  // ---------------------------------------------------------
  {
    nome: 'Banco BAI',
    cnpj: '00.000.000/0001-05',
    email: 'seguranca@bancobai.ao',
    telefone: '+244 222 000 005',
    clienteNome: 'Teresa Chindongo',
    clienteEmail: 'gestor@bancobai.ao',
    licencas: [
      { plano: PlanoLicenca.Premium, maxDeFuncionarios: 100, inicioDiasAtras: 300, expiraEmDias: 65 },
    ],
    pagamentos: [
      { licencaIndex: 0, valor: 250000, status: StatusPagamento.Concluido, referencia: 'REF-2025-005', diasAtras: 300 },
      { licencaIndex: 0, valor: 250000, status: StatusPagamento.Reembolsado, referencia: 'REF-2025-005B', diasAtras: 150 },
    ],
    funcionarios: [
      { nome: 'Osvaldo Miguel', email: 'o.miguel@bancobai.ao', cargo: 'Técnico de TI', telefone: '+244 927 000 001', status: StatusFuncionario.Ativo },
      { nome: 'Lurdes Bastos', email: 'l.bastos@bancobai.ao', cargo: 'Analista de Segurança', telefone: '+244 927 000 002', status: StatusFuncionario.Ativo },
      { nome: 'Emanuel Fortunato', email: 'e.fortunato@bancobai.ao', cargo: 'Técnico de Manutenção Predial', status: StatusFuncionario.Ativo },
      { nome: 'Graça Ndala', email: 'g.ndala@bancobai.ao', cargo: 'Supervisora de Agência', status: StatusFuncionario.Ativo },
    ],
    equipamentos: [
      { nome: 'ATM Multicaixa MX-14', modelo: 'NCR SelfServ 84', fabricante: 'NCR', numeroSerie: 'NC-2021-MX14', localizacao: 'Agência Central — Hall', status: StatusEquipamento.Operacional },
      { nome: 'Servidor de Transações SRV-BK1', modelo: 'HPE ProLiant DL380', fabricante: 'HPE', numeroSerie: 'HP-2022-BK01', localizacao: 'Datacenter — Rack 1', status: StatusEquipamento.Operacional },
      { nome: 'Gerador de Backup GB-03', modelo: 'Caterpillar C9', fabricante: 'Caterpillar', numeroSerie: 'CT-2020-GB03', localizacao: 'Agência Central — Cave', status: StatusEquipamento.Operacional },
      { nome: 'Sistema de Videovigilância CCTV-07', modelo: 'Hikvision DS-9000', fabricante: 'Hikvision', numeroSerie: 'HK-2022-CC07', localizacao: 'Agência Central — Sala de Segurança', status: StatusEquipamento.Manutencao },
      { nome: 'Cofre Eletrónico CE-01', modelo: 'Diebold ATLAS', fabricante: 'Diebold', numeroSerie: 'DB-2019-CE01', localizacao: 'Agência Central — Cofre', status: StatusEquipamento.Operacional },
    ],
    alertas: [
      { descricao: 'Falha na dispensa de notas do ATM', nivel: NivelAlerta.critico, equipamentoIndex: 0, diasAtras: 0 },
      { descricao: 'Latência elevada no servidor de transações', nivel: NivelAlerta.critico, equipamentoIndex: 1, diasAtras: 1 },
      { descricao: 'Teste automático de arranque do gerador falhou', nivel: NivelAlerta.medio, equipamentoIndex: 2, diasAtras: 3, lida: true },
      { descricao: 'Câmara offline no corredor principal', nivel: NivelAlerta.medio, equipamentoIndex: 3, diasAtras: 5 },
      { descricao: 'Sensor de porta do cofre com leitura intermitente', nivel: NivelAlerta.razoavel, equipamentoIndex: 4, diasAtras: 9, lida: true },
      { descricao: 'Papel de recibo do ATM em nível baixo', nivel: NivelAlerta.razoavel, equipamentoIndex: 0, diasAtras: 14 },
    ],
    documentos: [
      { nomeArquivo: 'auditoria_seguranca_ti_2026.pdf', status: StatusDocumento.Lido, diasAtras: 45 },
      { nomeArquivo: 'nota_credito_reembolso.pdf', status: StatusDocumento.Arquivado, diasAtras: 150 },
    ],
  },

  // ---------------------------------------------------------
  // 6. ENSA Seguros — Seguros (Básico, a expirar em breve)
  // ---------------------------------------------------------
  {
    nome: 'ENSA Seguros',
    cnpj: '00.000.000/0001-06',
    email: 'suporte@ensa.co.ao',
    telefone: '+244 222 000 006',
    clienteNome: 'Miguel Sango',
    clienteEmail: 'gestor@ensa.co.ao',
    licencas: [
      { plano: PlanoLicenca.Basico, maxDeFuncionarios: 10, inicioDiasAtras: 360, expiraEmDias: 5 },
    ],
    pagamentos: [
      { licencaIndex: 0, valor: 45000, status: StatusPagamento.Concluido, referencia: 'REF-2025-006', diasAtras: 360 },
    ],
    funcionarios: [
      { nome: 'Adelaide Zola', email: 'a.zola@ensa.co.ao', cargo: 'Técnica de Suporte', status: StatusFuncionario.Ativo },
      { nome: 'Fernando Bento', email: 'f.bento@ensa.co.ao', cargo: 'Administrador de Sistemas', status: StatusFuncionario.Ativo },
      { nome: 'Cristina Wanga', email: 'c.wanga@ensa.co.ao', cargo: 'Técnica de Infraestrutura', status: StatusFuncionario.Pendente },
    ],
    equipamentos: [
      { nome: 'Servidor de Aplicações SRV-ENSA1', modelo: 'Lenovo ThinkSystem SR650', fabricante: 'Lenovo', numeroSerie: 'LN-2021-EN01', localizacao: 'Sede — Sala de Servidores', status: StatusEquipamento.Operacional },
      { nome: 'Gerador de Emergência GE-09', modelo: 'Perkins 1104C', fabricante: 'Perkins', numeroSerie: 'PK-2019-GE09', localizacao: 'Sede — Cave Técnica', status: StatusEquipamento.Operacional },
      { nome: 'Ar Condicionado Central AC-12', modelo: 'Daikin VRV IV', fabricante: 'Daikin', numeroSerie: 'DK-2020-AC12', localizacao: 'Sede — Piso 2', status: StatusEquipamento.Manutencao },
      { nome: 'No-Break UPS-05', modelo: 'APC Symmetra PX', fabricante: 'APC', numeroSerie: 'AP-2022-UP05', localizacao: 'Sede — Sala de Servidores', status: StatusEquipamento.Operacional },
    ],
    alertas: [
      { descricao: 'Espaço em disco do servidor abaixo de 10%', nivel: NivelAlerta.critico, equipamentoIndex: 0, diasAtras: 0 },
      { descricao: 'Bateria do UPS a necessitar de substituição', nivel: NivelAlerta.medio, equipamentoIndex: 3, diasAtras: 6, lida: true },
      { descricao: 'Filtro do ar condicionado obstruído', nivel: NivelAlerta.razoavel, equipamentoIndex: 2, diasAtras: 11 },
    ],
    documentos: [
      { nomeArquivo: 'aviso_renovacao_licenca.pdf', status: StatusDocumento.NaoLido, diasAtras: 1 },
    ],
  },

  // ---------------------------------------------------------
  // 7. Refriango — Indústria de Bebidas (Profissional, suspensa)
  // ---------------------------------------------------------
  {
    nome: 'Refriango Indústria de Bebidas',
    cnpj: '00.000.000/0001-07',
    email: 'manutencao@refriango.ao',
    telefone: '+244 222 000 007',
    clienteNome: 'Alberto Quimbamba',
    clienteEmail: 'gestor@refriango.ao',
    licencas: [
      { plano: PlanoLicenca.Profissional, status: StatusLicenca.Suspensa, maxDeFuncionarios: 30, inicioDiasAtras: 120, expiraEmDias: 245, observacoes: 'Suspensa por falta de pagamento — 2ª notificação enviada.' },
    ],
    pagamentos: [
      { licencaIndex: 0, valor: 120000, status: StatusPagamento.Pendente, referencia: 'REF-2025-007', diasAtras: 45 },
    ],
    funcionarios: [
      { nome: 'Vasco Almeida', email: 'v.almeida@refriango.ao', cargo: 'Engenheiro de Produção', telefone: '+244 928 000 001', status: StatusFuncionario.Ativo },
      { nome: 'Rosa Kimbanda', email: 'r.kimbanda@refriango.ao', cargo: 'Técnica de Manutenção', status: StatusFuncionario.Ativo },
      { nome: 'Adão Fungo', email: 'a.fungo@refriango.ao', cargo: 'Operador de Linha', status: StatusFuncionario.Ativo },
      { nome: 'Ester Manuel', email: 'e.manuel@refriango.ao', cargo: 'Supervisora de Qualidade', status: StatusFuncionario.Pendente },
      { nome: 'Gil Sumbo', email: 'g.sumbo@refriango.ao', cargo: 'Técnico Eletromecânico', status: StatusFuncionario.Inativo },
    ],
    equipamentos: [
      { nome: 'Linha de Engarrafamento LE-03', modelo: 'Krones Contiform', fabricante: 'Krones', numeroSerie: 'KR-2018-LE03', localizacao: 'Fábrica — Linha 1', status: StatusEquipamento.Operacional },
      { nome: 'Caldeira a Vapor CV-02', modelo: 'Bosch Loos UL-S', fabricante: 'Bosch', numeroSerie: 'BS-2017-CV02', localizacao: 'Fábrica — Sala de Caldeiras', status: StatusEquipamento.Manutencao },
      { nome: 'Compressor Industrial CI-08', modelo: 'Ingersoll Rand R-Series', fabricante: 'Ingersoll Rand', numeroSerie: 'IR-2019-CI08', localizacao: 'Fábrica — Casa de Máquinas', status: StatusEquipamento.Operacional },
      { nome: 'Esteira Transportadora ET-05', modelo: 'Dorner 2200', fabricante: 'Dorner', numeroSerie: 'DR-2020-ET05', localizacao: 'Fábrica — Linha 2', status: StatusEquipamento.Operacional },
      { nome: 'Câmara de Refrigeração CR-01', modelo: 'Carrier CoolLine', fabricante: 'Carrier', numeroSerie: 'CR-2021-CR01', localizacao: 'Fábrica — Armazém', status: StatusEquipamento.Operacional },
    ],
    alertas: [
      { descricao: 'Paragem inesperada na linha de engarrafamento', nivel: NivelAlerta.critico, equipamentoIndex: 0, diasAtras: 0 },
      { descricao: 'Pressão da caldeira acima do limite de segurança', nivel: NivelAlerta.critico, equipamentoIndex: 1, diasAtras: 2 },
      { descricao: 'Vazamento de ar detectado no compressor', nivel: NivelAlerta.medio, equipamentoIndex: 2, diasAtras: 5, lida: true },
      { descricao: 'Desalinhamento na esteira transportadora', nivel: NivelAlerta.razoavel, equipamentoIndex: 3, diasAtras: 8 },
      { descricao: 'Temperatura da câmara de refrigeração acima do ideal', nivel: NivelAlerta.medio, equipamentoIndex: 4, diasAtras: 16, lida: true },
    ],
    documentos: [
      { nomeArquivo: 'notificacao_pagamento_pendente.pdf', status: StatusDocumento.NaoLido, diasAtras: 10 },
      { nomeArquivo: 'relatorio_producao_mensal.pdf', status: StatusDocumento.Lido, diasAtras: 25 },
    ],
  },

  // ---------------------------------------------------------
  // 8. Porto de Luanda — Logística Portuária (Premium, expirada)
  // ---------------------------------------------------------
  {
    nome: 'Porto de Luanda — Terminal de Contentores',
    cnpj: '00.000.000/0001-08',
    email: 'operacoes@portoluanda.ao',
    telefone: '+244 222 000 008',
    clienteNome: 'Domingas Sapalo',
    clienteEmail: 'gestor@portoluanda.ao',
    licencas: [
      { plano: PlanoLicenca.Premium, maxDeFuncionarios: 100, inicioDiasAtras: 400, expiraEmDias: -20 },
    ],
    pagamentos: [
      { licencaIndex: 0, valor: 250000, status: StatusPagamento.Concluido, referencia: 'REF-2025-008', diasAtras: 400 },
    ],
    funcionarios: [
      { nome: 'Zeferino Palanca', email: 'z.palanca@portoluanda.ao', cargo: 'Operador de Grua', telefone: '+244 929 000 001', status: StatusFuncionario.Ativo },
      { nome: 'Helena Bumba', email: 'h.bumba@portoluanda.ao', cargo: 'Técnica de Manutenção Portuária', status: StatusFuncionario.Ativo },
      { nome: 'Salvador Necaca', email: 's.necaca@portoluanda.ao', cargo: 'Supervisor de Operações', status: StatusFuncionario.Ativo },
      { nome: 'Fátima Bento', email: 'f.bento2@portoluanda.ao', cargo: 'Técnica Eletromecânica', status: StatusFuncionario.Pendente },
      { nome: 'Cristóvão Massano', email: 'c.massano@portoluanda.ao', cargo: 'Estivador Chefe', status: StatusFuncionario.Inativo },
    ],
    equipamentos: [
      { nome: 'Grua Pórtico GP-01', modelo: 'Liebherr LHM 550', fabricante: 'Liebherr', numeroSerie: 'LH-2015-GP01', localizacao: 'Terminal — Cais 3', status: StatusEquipamento.Manutencao },
      { nome: 'Empilhadeira Industrial EI-04', modelo: 'Kalmar DCG180', fabricante: 'Kalmar', numeroSerie: 'KL-2018-EI04', localizacao: 'Terminal — Armazém 2', status: StatusEquipamento.Operacional },
      { nome: 'Esteira de Contentores EC-02', modelo: 'ZPMC Rail-Mounted', fabricante: 'ZPMC', numeroSerie: 'ZP-2016-EC02', localizacao: 'Terminal — Cais 1', status: StatusEquipamento.Operacional },
      { nome: 'Gerador Portuário GP-07', modelo: 'MTU 16V4000', fabricante: 'MTU', numeroSerie: 'MT-2017-GP07', localizacao: 'Terminal — Central Eléctrica', status: StatusEquipamento.Operacional },
      { nome: 'Sistema de Pesagem SP-03', modelo: 'Avery Weigh-Tronix', fabricante: 'Avery Weigh-Tronix', numeroSerie: 'AW-2019-SP03', localizacao: 'Terminal — Portaria', status: StatusEquipamento.Operacional },
    ],
    alertas: [
      { descricao: 'Falha no sistema de travagem da grua pórtico', nivel: NivelAlerta.critico, equipamentoIndex: 0, diasAtras: 0 },
      { descricao: 'Sobreaquecimento do motor da empilhadeira', nivel: NivelAlerta.medio, equipamentoIndex: 1, diasAtras: 4, lida: true },
      { descricao: 'Ruído anómalo na esteira de contentores', nivel: NivelAlerta.razoavel, equipamentoIndex: 2, diasAtras: 7 },
      { descricao: 'Consumo de combustível acima do esperado', nivel: NivelAlerta.razoavel, equipamentoIndex: 3, diasAtras: 12, lida: true },
      { descricao: 'Discrepância na calibração do sistema de pesagem', nivel: NivelAlerta.medio, equipamentoIndex: 4, diasAtras: 19 },
    ],
    documentos: [
      { nomeArquivo: 'aviso_expiracao_licenca.pdf', status: StatusDocumento.NaoLido, diasAtras: 20 },
      { nomeArquivo: 'relatorio_operacoes_portuarias.pdf', status: StatusDocumento.Lido, diasAtras: 60 },
    ],
  },
]

// =============================================================
// LIMPEZA (ordem importa por causa das FK)
// =============================================================

async function limpar() {
  console.log('🗑️  Limpando banco de dados...')
  await prisma.log.deleteMany()
  await prisma.documento.deleteMany()
  await prisma.alerta.deleteMany()
  await prisma.equipamento.deleteMany()
  await prisma.funcionario.deleteMany()
  await prisma.pagamento.deleteMany()
  await prisma.licenca.deleteMany()
  await prisma.sessaoAtiva.deleteMany()
  await prisma.usuario.deleteMany()
  await prisma.empresa.deleteMany()
  console.log('   Concluído.\n')
}

// =============================================================
// CRIAÇÃO DE UMA EMPRESA COMPLETA
// =============================================================

async function criarEmpresa(spec: EmpresaSpec) {
  const empresa = await prisma.empresa.create({
    data: {
      nome:     spec.nome,
      cnpj:     spec.cnpj,
      email:    spec.email,
      telefone: spec.telefone,
    },
  })

  const licencas = []
  for (const l of spec.licencas) {
    licencas.push(await prisma.licenca.create({
      data: {
        plano:            l.plano,
        status:           l.status ?? StatusLicenca.Ativa,
        maxDeFuncionarios: l.maxDeFuncionarios,
        inicioEm:         comData(-l.inicioDiasAtras),
        expiraEm:         comData(l.expiraEmDias),
        observacoes:      l.observacoes,
        empresaId:        empresa.id,
      },
    }))
  }

  for (const p of spec.pagamentos) {
    await prisma.pagamento.create({
      data: {
        valor:      p.valor,
        moeda:      'AOA',
        status:     p.status,
        referencia: p.referencia,
        criadoEm:   comData(-p.diasAtras),
        empresaId:  empresa.id,
        licencaId:  licencas[p.licencaIndex].id,
      },
    })
  }

  const cliente = await prisma.usuario.create({
    data: {
      email:     spec.clienteEmail,
      nome:      spec.clienteNome,
      senhaHash: await hashSenha(SENHA_PADRAO),
      papel:     Papel.Cliente,
      empresaId: empresa.id,
    },
  })

  await prisma.funcionario.createMany({
    data: spec.funcionarios.map((f) => ({
      nome:      f.nome,
      email:     f.email,
      cargo:     f.cargo,
      telefone:  f.telefone,
      status:    f.status ?? StatusFuncionario.Pendente,
      empresaId: empresa.id,
    })),
  })

  const equipamentos = []
  for (const e of spec.equipamentos) {
    equipamentos.push(await prisma.equipamento.create({
      data: {
        nome:        e.nome,
        modelo:      e.modelo,
        fabricante:  e.fabricante,
        numeroSerie: e.numeroSerie,
        localizacao: e.localizacao,
        status:      e.status ?? StatusEquipamento.Operacional,
        empresaId:   empresa.id,
      },
    }))
  }

  for (const a of spec.alertas) {
    await prisma.alerta.create({
      data: {
        descricao:     a.descricao,
        nivel:         a.nivel,
        criadoEm:      comData(-a.diasAtras, 8 + (a.diasAtras % 10)),
        empresaId:     empresa.id,
        equipamentoId: equipamentos[a.equipamentoIndex].id,
        lidoPorId:     a.lida ? cliente.id : undefined,
        lidoEm:        a.lida ? comData(-a.diasAtras + 1) : undefined,
      },
    })
  }

  for (const d of spec.documentos) {
    await prisma.documento.create({
      data: {
        nomeArquivo:   d.nomeArquivo,
        caminho:       `/uploads/documentos/${empresa.id}-${d.nomeArquivo}`,
        status:        d.status ?? StatusDocumento.NaoLido,
        criadoEm:      comData(-d.diasAtras),
        empresaId:     empresa.id,
        responsavelId: cliente.id,
      },
    })
  }

  return { empresa, cliente, equipamentos }
}

// =============================================================
// LOGS — histórico de acessos/acções ao longo dos últimos ~14 dias
// =============================================================

async function criarLogsUsuario(usuarioId: string, papel: Papel, empresaId: string | null, acoes: { metodo: string; caminho: string }[]) {
  const diasLogin = [13, 11, 9, 7, 5, 3, 1]
  for (const d of diasLogin) {
    await prisma.log.create({
      data: {
        acao:         'LOGIN',
        nivelUsuario: papel,
        statusHttp:   200,
        criadoEm:     comData(-d, 8),
        usuarioId,
        empresaId,
      },
    })
  }

  const diasAcao = [12, 10, 8, 6, 5, 4, 3, 2, 1, 0]
  await Promise.all(diasAcao.map((d, i) => {
    const a = acoes[i % acoes.length]
    return prisma.log.create({
      data: {
        acao:         `${a.metodo} ${a.caminho}`,
        nivelUsuario: papel,
        statusHttp:   i % 9 === 0 ? 404 : i % 13 === 0 ? 500 : a.metodo === 'POST' ? 201 : 200,
        criadoEm:     comData(-d, 9 + (i % 8)),
        usuarioId,
        empresaId,
      },
    })
  }))
}

// =============================================================
// SEED PRINCIPAL
// =============================================================

async function main() {
  await limpar()

  // -----------------------------------------------------------
  // USUÁRIOS de plataforma (ADM / Operacional)
  // -----------------------------------------------------------
  console.log('👤 Criando usuários ADM e Operacional...')

  const adm = await prisma.usuario.create({
    data: {
      email:     'admin@kgtech.com',
      nome:      'Administrador Master',
      senhaHash: await hashSenha('Admin@123'),
      papel:     Papel.ADM,
    },
  })

  const adm2 = await prisma.usuario.create({
    data: {
      email:     'adriana.costa@kgtech.com',
      nome:      'Adriana Costa',
      senhaHash: await hashSenha('Admin@123'),
      papel:     Papel.ADM,
    },
  })

  const operacional = await prisma.usuario.create({
    data: {
      email:     'operacional@sistema.ao',
      nome:      'Gestor Operacional',
      senhaHash: await hashSenha('Oper@123'),
      papel:     Papel.Operacional,
    },
  })

  const operacional2 = await prisma.usuario.create({
    data: {
      email:     'bruno.fernandes@sistema.ao',
      nome:      'Bruno Fernandes',
      senhaHash: await hashSenha('Oper@123'),
      papel:     Papel.Operacional,
    },
  })

  const operacional3 = await prisma.usuario.create({
    data: {
      email:     'celia.santos@sistema.ao',
      nome:      'Célia Santos',
      senhaHash: await hashSenha('Oper@123'),
      papel:     Papel.Operacional,
    },
  })

  console.log(`   ✓ ${adm.nome}, ${adm2.nome} (ADM)`)
  console.log(`   ✓ ${operacional.nome}, ${operacional2.nome}, ${operacional3.nome} (Operacional)\n`)

  // -----------------------------------------------------------
  // EMPRESAS
  // -----------------------------------------------------------
  console.log(`🏭 Criando ${empresasSpec.length} empresas com licenças, pagamentos, funcionários, equipamentos, alertas e documentos...`)

  const resultados = []
  for (const spec of empresasSpec) {
    const r = await criarEmpresa(spec)
    resultados.push(r)
    console.log(`   ✓ ${r.empresa.nome} (${spec.funcionarios.length} funcionários, ${spec.equipamentos.length} equipamentos, ${spec.alertas.length} alertas)`)
  }
  console.log()

  // -----------------------------------------------------------
  // LOGS
  // -----------------------------------------------------------
  console.log('📜 Gerando histórico de logs (últimos 14 dias)...')

  const acoesAdm = [
    { metodo: 'GET',   caminho: '/api/v1/empresas' },
    { metodo: 'POST',  caminho: '/api/v1/empresas' },
    { metodo: 'GET',   caminho: '/api/v1/pagamentos' },
    { metodo: 'PATCH', caminho: '/api/v1/pagamentos' },
    { metodo: 'GET',   caminho: '/api/v1/documentos' },
    { metodo: 'GET',   caminho: '/api/v1/usuarios' },
  ]
  const acoesOperacional = [
    { metodo: 'GET',   caminho: '/api/v1/empresas' },
    { metodo: 'GET',   caminho: '/api/v1/equipamentos' },
    { metodo: 'GET',   caminho: '/api/v1/alertas' },
    { metodo: 'PATCH', caminho: '/api/v1/alertas' },
    { metodo: 'GET',   caminho: '/api/v1/usuarios/online' },
    { metodo: 'GET',   caminho: '/api/v1/relatorios' },
  ]
  const acoesCliente = [
    { metodo: 'GET',   caminho: '/api/v1/funcionarios' },
    { metodo: 'POST',  caminho: '/api/v1/funcionarios' },
    { metodo: 'GET',   caminho: '/api/v1/pagamentos' },
    { metodo: 'GET',   caminho: '/api/v1/licencas' },
    { metodo: 'GET',   caminho: '/api/v1/alertas' },
    { metodo: 'GET',   caminho: '/api/v1/equipamentos' },
  ]

  await criarLogsUsuario(adm.id, Papel.ADM, null, acoesAdm)
  await criarLogsUsuario(adm2.id, Papel.ADM, null, acoesAdm)
  await criarLogsUsuario(operacional.id, Papel.Operacional, null, acoesOperacional)
  await criarLogsUsuario(operacional2.id, Papel.Operacional, null, acoesOperacional)
  await criarLogsUsuario(operacional3.id, Papel.Operacional, null, acoesOperacional)

  for (const r of resultados) {
    await criarLogsUsuario(r.cliente.id, Papel.Cliente, r.empresa.id, acoesCliente)
  }

  console.log('   ✓ Logs gerados para todos os usuários\n')

  // -----------------------------------------------------------
  // RESUMO FINAL
  // -----------------------------------------------------------
  const totais = await Promise.all([
    prisma.empresa.count(),
    prisma.usuario.count(),
    prisma.funcionario.count(),
    prisma.equipamento.count(),
    prisma.alerta.count(),
    prisma.licenca.count(),
    prisma.pagamento.count(),
    prisma.documento.count(),
    prisma.log.count(),
  ])

  console.log('═══════════════════════════════════════')
  console.log('✅  Seed concluído com sucesso!')
  console.log('═══════════════════════════════════════')
  console.log(`   Empresas:     ${totais[0]}`)
  console.log(`   Usuários:     ${totais[1]}  (2 ADM · 3 Operacional · ${empresasSpec.length} Clientes)`)
  console.log(`   Funcionários: ${totais[2]}`)
  console.log(`   Equipamentos: ${totais[3]}`)
  console.log(`   Alertas:      ${totais[4]}`)
  console.log(`   Licenças:     ${totais[5]}`)
  console.log(`   Pagamentos:   ${totais[6]}`)
  console.log(`   Documentos:   ${totais[7]}`)
  console.log(`   Logs:         ${totais[8]}`)
  console.log('═══════════════════════════════════════')
  console.log()
  console.log('🔑 Credenciais de acesso:')
  console.log('   ADM          → admin@kgtech.com               / Admin@123')
  console.log('   ADM          → adriana.costa@kgtech.com       / Admin@123')
  console.log('   Operacional  → operacional@sistema.ao         / Oper@123')
  console.log('   Operacional  → bruno.fernandes@sistema.ao     / Oper@123')
  console.log('   Operacional  → celia.santos@sistema.ao        / Oper@123')
  for (const spec of empresasSpec) {
    console.log(`   Cliente      → ${spec.clienteEmail.padEnd(30)} / ${SENHA_PADRAO}  (${spec.nome})`)
  }
  console.log()
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e)
    ;(globalThis as any).process?.exit?.(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
