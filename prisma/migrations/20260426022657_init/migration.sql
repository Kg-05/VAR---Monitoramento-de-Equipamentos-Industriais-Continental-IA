-- CreateEnum
CREATE TYPE "Papel" AS ENUM ('ADM', 'Operacional', 'Cliente');

-- CreateEnum
CREATE TYPE "StatusUsuario" AS ENUM ('Ativo', 'Inativo');

-- CreateEnum
CREATE TYPE "StatusFuncionario" AS ENUM ('Ativo', 'Inativo', 'Pendente');

-- CreateEnum
CREATE TYPE "StatusEquipamento" AS ENUM ('Operacional', 'Manutencao');

-- CreateEnum
CREATE TYPE "NivelAlerta" AS ENUM ('razoavel', 'medio', 'critico');

-- CreateEnum
CREATE TYPE "PlanoLicenca" AS ENUM ('Basico', 'Profissional', 'Premium');

-- CreateEnum
CREATE TYPE "StatusLicenca" AS ENUM ('Ativa', 'Expirada', 'Suspensa');

-- CreateEnum
CREATE TYPE "StatusPagamento" AS ENUM ('Pendente', 'Concluido', 'Reembolsado');

-- CreateTable
CREATE TABLE "empresas" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefone" TEXT,
    "status" "StatusUsuario" NOT NULL DEFAULT 'Ativo',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "empresas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "papel" "Papel" NOT NULL,
    "status" "StatusUsuario" NOT NULL DEFAULT 'Ativo',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "empresaId" TEXT,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "funcionarios" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "cargo" TEXT NOT NULL,
    "telefone" TEXT,
    "status" "StatusFuncionario" NOT NULL DEFAULT 'Pendente',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "empresaId" TEXT NOT NULL,

    CONSTRAINT "funcionarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipamentos" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "modelo" TEXT NOT NULL,
    "fabricante" TEXT,
    "numeroSerie" TEXT,
    "localizacao" TEXT NOT NULL,
    "status" "StatusEquipamento" NOT NULL DEFAULT 'Operacional',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "empresaId" TEXT NOT NULL,

    CONSTRAINT "equipamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alertas" (
    "id" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "nivel" "NivelAlerta" NOT NULL,
    "lidoEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "empresaId" TEXT NOT NULL,
    "equipamentoId" TEXT NOT NULL,
    "lidoPorId" TEXT,

    CONSTRAINT "alertas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "logs" (
    "id" TEXT NOT NULL,
    "acao" TEXT NOT NULL,
    "nivelUsuario" "Papel" NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "statusHttp" INTEGER,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuarioId" TEXT,
    "empresaId" TEXT,

    CONSTRAINT "logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "licencas" (
    "id" TEXT NOT NULL,
    "plano" "PlanoLicenca" NOT NULL,
    "status" "StatusLicenca" NOT NULL DEFAULT 'Ativa',
    "maxDeFuncionarios" INTEGER NOT NULL,
    "inicioEm" TIMESTAMP(3) NOT NULL,
    "expiraEm" TIMESTAMP(3) NOT NULL,
    "observacoes" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "empresaId" TEXT NOT NULL,

    CONSTRAINT "licencas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagamentos" (
    "id" TEXT NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "moeda" TEXT NOT NULL DEFAULT 'AOA',
    "status" "StatusPagamento" NOT NULL DEFAULT 'Pendente',
    "referencia" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "empresaId" TEXT NOT NULL,
    "licencaId" TEXT NOT NULL,

    CONSTRAINT "pagamentos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "empresas_cnpj_key" ON "empresas"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "empresas_email_key" ON "empresas"("email");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE INDEX "usuarios_empresaId_idx" ON "usuarios"("empresaId");

-- CreateIndex
CREATE INDEX "usuarios_papel_idx" ON "usuarios"("papel");

-- CreateIndex
CREATE INDEX "funcionarios_empresaId_idx" ON "funcionarios"("empresaId");

-- CreateIndex
CREATE INDEX "funcionarios_status_idx" ON "funcionarios"("status");

-- CreateIndex
CREATE UNIQUE INDEX "funcionarios_email_empresaId_key" ON "funcionarios"("email", "empresaId");

-- CreateIndex
CREATE INDEX "equipamentos_empresaId_idx" ON "equipamentos"("empresaId");

-- CreateIndex
CREATE INDEX "equipamentos_status_idx" ON "equipamentos"("status");

-- CreateIndex
CREATE UNIQUE INDEX "equipamentos_numeroSerie_empresaId_key" ON "equipamentos"("numeroSerie", "empresaId");

-- CreateIndex
CREATE INDEX "alertas_empresaId_idx" ON "alertas"("empresaId");

-- CreateIndex
CREATE INDEX "alertas_equipamentoId_idx" ON "alertas"("equipamentoId");

-- CreateIndex
CREATE INDEX "alertas_nivel_idx" ON "alertas"("nivel");

-- CreateIndex
CREATE INDEX "alertas_lidoPorId_idx" ON "alertas"("lidoPorId");

-- CreateIndex
CREATE INDEX "alertas_criadoEm_idx" ON "alertas"("criadoEm");

-- CreateIndex
CREATE INDEX "logs_usuarioId_idx" ON "logs"("usuarioId");

-- CreateIndex
CREATE INDEX "logs_empresaId_idx" ON "logs"("empresaId");

-- CreateIndex
CREATE INDEX "logs_criadoEm_idx" ON "logs"("criadoEm");

-- CreateIndex
CREATE INDEX "logs_nivelUsuario_idx" ON "logs"("nivelUsuario");

-- CreateIndex
CREATE INDEX "licencas_empresaId_idx" ON "licencas"("empresaId");

-- CreateIndex
CREATE INDEX "licencas_status_idx" ON "licencas"("status");

-- CreateIndex
CREATE INDEX "licencas_expiraEm_idx" ON "licencas"("expiraEm");

-- CreateIndex
CREATE INDEX "pagamentos_empresaId_idx" ON "pagamentos"("empresaId");

-- CreateIndex
CREATE INDEX "pagamentos_licencaId_idx" ON "pagamentos"("licencaId");

-- CreateIndex
CREATE INDEX "pagamentos_status_idx" ON "pagamentos"("status");

-- CreateIndex
CREATE INDEX "pagamentos_criadoEm_idx" ON "pagamentos"("criadoEm");

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "funcionarios" ADD CONSTRAINT "funcionarios_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipamentos" ADD CONSTRAINT "equipamentos_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alertas" ADD CONSTRAINT "alertas_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alertas" ADD CONSTRAINT "alertas_equipamentoId_fkey" FOREIGN KEY ("equipamentoId") REFERENCES "equipamentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alertas" ADD CONSTRAINT "alertas_lidoPorId_fkey" FOREIGN KEY ("lidoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logs" ADD CONSTRAINT "logs_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logs" ADD CONSTRAINT "logs_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "licencas" ADD CONSTRAINT "licencas_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagamentos" ADD CONSTRAINT "pagamentos_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagamentos" ADD CONSTRAINT "pagamentos_licencaId_fkey" FOREIGN KEY ("licencaId") REFERENCES "licencas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
