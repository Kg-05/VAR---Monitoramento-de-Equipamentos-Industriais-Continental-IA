-- CreateTable
CREATE TABLE "equipamentos_destacados" (
    "id" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "funcionarioId" TEXT NOT NULL,
    "equipamentoId" TEXT NOT NULL,
    "destacadoPorId" TEXT,

    CONSTRAINT "equipamentos_destacados_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "equipamentos_destacados_funcionarioId_idx" ON "equipamentos_destacados"("funcionarioId");

-- CreateIndex
CREATE INDEX "equipamentos_destacados_equipamentoId_idx" ON "equipamentos_destacados"("equipamentoId");

-- CreateIndex
CREATE UNIQUE INDEX "equipamentos_destacados_funcionarioId_equipamentoId_key" ON "equipamentos_destacados"("funcionarioId", "equipamentoId");

-- AddForeignKey
ALTER TABLE "equipamentos_destacados" ADD CONSTRAINT "equipamentos_destacados_funcionarioId_fkey" FOREIGN KEY ("funcionarioId") REFERENCES "funcionarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipamentos_destacados" ADD CONSTRAINT "equipamentos_destacados_equipamentoId_fkey" FOREIGN KEY ("equipamentoId") REFERENCES "equipamentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipamentos_destacados" ADD CONSTRAINT "equipamentos_destacados_destacadoPorId_fkey" FOREIGN KEY ("destacadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
