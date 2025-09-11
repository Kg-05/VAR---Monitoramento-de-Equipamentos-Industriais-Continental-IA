-- CreateEnum
CREATE TYPE "public"."Papel" AS ENUM ('ADMIN_CENTRAL', 'ADMIN_EMPRESA', 'FUNCIONARIO');

-- CreateEnum
CREATE TYPE "public"."StatusLicenca" AS ENUM ('ATIVA', 'EXPIRADA', 'PENDENTE', 'SUSPENSA');

-- CreateEnum
CREATE TYPE "public"."StatusPagamento" AS ENUM ('PENDENTE', 'CONCLUIDO', 'FALHOU', 'REEMBOLSADO');

-- CreateEnum
CREATE TYPE "public"."StatusEquipamento" AS ENUM ('OPERACIONAL', 'MANUTENCAO');

-- CreateEnum
CREATE TYPE "public"."SeveridadeAlerta" AS ENUM ('BAIXO', 'MEDIO', 'ALTO');

-- CreateTable
CREATE TABLE "public"."Empresa" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "nif" TEXT,
    "endereco" TEXT,
    "contacto" TEXT,
    "email" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Empresa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Usuario" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "nome" TEXT,
    "papel" "public"."Papel" NOT NULL DEFAULT 'FUNCIONARIO',
    "empresaId" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Licenca" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "plano" TEXT NOT NULL,
    "status" "public"."StatusLicenca" NOT NULL DEFAULT 'PENDENTE',
    "maxFuncionarios" INTEGER NOT NULL DEFAULT 2,
    "inicioEm" TIMESTAMP(3),
    "expiraEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Licenca_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Pagamento" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "licencaId" TEXT,
    "valor" DOUBLE PRECISION NOT NULL,
    "moeda" TEXT NOT NULL DEFAULT 'AOA',
    "status" "public"."StatusPagamento" NOT NULL DEFAULT 'PENDENTE',
    "referenciaProvedor" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pagamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Equipamento" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "modelo" TEXT,
    "numeroSerie" TEXT,
    "localizacao" TEXT,
    "status" "public"."StatusEquipamento" NOT NULL DEFAULT 'OPERACIONAL',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Equipamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Dispositivo" (
    "id" TEXT NOT NULL,
    "equipamentoId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" TEXT,
    "rtspUrl" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dispositivo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Avaria" (
    "id" TEXT NOT NULL,
    "equipamentoId" TEXT NOT NULL,
    "dispositivoId" TEXT,
    "detectadoPor" TEXT,
    "descricao" TEXT,
    "confianca" DOUBLE PRECISION,
    "severidade" "public"."SeveridadeAlerta" NOT NULL,
    "imagemUrl" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvido" BOOLEAN NOT NULL DEFAULT false,
    "resolvidoEm" TIMESTAMP(3),
    "resolvidoPorId" TEXT,

    CONSTRAINT "Avaria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Alerta" (
    "id" TEXT NOT NULL,
    "avariaId" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lidoPorId" TEXT,
    "lidoEm" TIMESTAMP(3),
    "mensagem" TEXT,
    "severidade" "public"."SeveridadeAlerta" NOT NULL,
    "reconhecido" BOOLEAN NOT NULL DEFAULT false,
    "reconhecidoEm" TIMESTAMP(3),

    CONSTRAINT "Alerta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Log" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT,
    "usuarioId" TEXT,
    "nivel" TEXT NOT NULL,
    "acao" TEXT NOT NULL,
    "dados" JSONB,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."_AvariaToUsuario" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_AvariaToUsuario_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "public"."_LidosPor" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_LidosPor_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Empresa_email_key" ON "public"."Empresa"("email");

-- CreateIndex
CREATE INDEX "Usuario_email_idx" ON "public"."Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Equipamento_numeroSerie_key" ON "public"."Equipamento"("numeroSerie");

-- CreateIndex
CREATE INDEX "_AvariaToUsuario_B_index" ON "public"."_AvariaToUsuario"("B");

-- CreateIndex
CREATE INDEX "_LidosPor_B_index" ON "public"."_LidosPor"("B");

-- AddForeignKey
ALTER TABLE "public"."Usuario" ADD CONSTRAINT "Usuario_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "public"."Empresa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Licenca" ADD CONSTRAINT "Licenca_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "public"."Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Pagamento" ADD CONSTRAINT "Pagamento_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "public"."Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Pagamento" ADD CONSTRAINT "Pagamento_licencaId_fkey" FOREIGN KEY ("licencaId") REFERENCES "public"."Licenca"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Equipamento" ADD CONSTRAINT "Equipamento_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "public"."Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Dispositivo" ADD CONSTRAINT "Dispositivo_equipamentoId_fkey" FOREIGN KEY ("equipamentoId") REFERENCES "public"."Equipamento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Avaria" ADD CONSTRAINT "Avaria_equipamentoId_fkey" FOREIGN KEY ("equipamentoId") REFERENCES "public"."Equipamento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Avaria" ADD CONSTRAINT "Avaria_dispositivoId_fkey" FOREIGN KEY ("dispositivoId") REFERENCES "public"."Dispositivo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Avaria" ADD CONSTRAINT "Avaria_resolvidoPorId_fkey" FOREIGN KEY ("resolvidoPorId") REFERENCES "public"."Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Alerta" ADD CONSTRAINT "Alerta_avariaId_fkey" FOREIGN KEY ("avariaId") REFERENCES "public"."Avaria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Alerta" ADD CONSTRAINT "Alerta_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "public"."Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Alerta" ADD CONSTRAINT "Alerta_lidoPorId_fkey" FOREIGN KEY ("lidoPorId") REFERENCES "public"."Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Log" ADD CONSTRAINT "Log_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "public"."Empresa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Log" ADD CONSTRAINT "Log_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "public"."Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_AvariaToUsuario" ADD CONSTRAINT "_AvariaToUsuario_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Avaria"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_AvariaToUsuario" ADD CONSTRAINT "_AvariaToUsuario_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_LidosPor" ADD CONSTRAINT "_LidosPor_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Alerta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_LidosPor" ADD CONSTRAINT "_LidosPor_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
