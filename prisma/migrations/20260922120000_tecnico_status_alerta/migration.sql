-- AlterEnum
ALTER TYPE "Papel" ADD VALUE 'Tecnico';

-- CreateEnum
CREATE TYPE "StatusAlerta" AS ENUM ('Aberto', 'EmCurso', 'AguardaApoio', 'Resolvido');

-- AlterTable
ALTER TABLE "alertas" ADD COLUMN     "status" "StatusAlerta" NOT NULL DEFAULT 'Aberto',
ADD COLUMN     "notaTecnico" TEXT;

-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "funcionarioId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_funcionarioId_key" ON "usuarios"("funcionarioId");

-- CreateIndex
CREATE INDEX "alertas_status_idx" ON "alertas"("status");

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_funcionarioId_fkey" FOREIGN KEY ("funcionarioId") REFERENCES "funcionarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
