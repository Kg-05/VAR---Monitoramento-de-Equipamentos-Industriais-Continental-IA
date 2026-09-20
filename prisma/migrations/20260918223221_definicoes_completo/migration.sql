-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "notificacaoEmailAtiva" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "totpAtivo" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "totpSecret" TEXT;

-- CreateTable
CREATE TABLE "sessoes_ativas" (
    "id" TEXT NOT NULL,
    "jti" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "userAgent" TEXT,
    "ip" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ultimoUso" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revogadaEm" TIMESTAMP(3),

    CONSTRAINT "sessoes_ativas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plataforma_config" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "nome" TEXT NOT NULL DEFAULT 'Kituxi Tech',
    "logotipoUrl" TEXT,
    "idioma" TEXT NOT NULL DEFAULT 'pt-PT',
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plataforma_config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sessoes_ativas_jti_key" ON "sessoes_ativas"("jti");

-- CreateIndex
CREATE INDEX "sessoes_ativas_usuarioId_idx" ON "sessoes_ativas"("usuarioId");

-- AddForeignKey
ALTER TABLE "sessoes_ativas" ADD CONSTRAINT "sessoes_ativas_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
