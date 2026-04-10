-- AlterTable
ALTER TABLE "public"."Pagamento" ADD COLUMN     "formaPagamentoId" TEXT;

-- CreateTable
CREATE TABLE "public"."RegistroImagem" (
    "id" TEXT NOT NULL,
    "dispositivoId" TEXT NOT NULL,
    "timestampCaptura" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "caminhoArquivo" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RegistroImagem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ResultadoAnaliseIA" (
    "id" TEXT NOT NULL,
    "registroImagemId" TEXT NOT NULL,
    "estadoDetectado" TEXT NOT NULL,
    "acuracia" DOUBLE PRECISION,
    "timestampAnalise" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResultadoAnaliseIA_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FormaPagamento" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,

    CONSTRAINT "FormaPagamento_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."Pagamento" ADD CONSTRAINT "Pagamento_formaPagamentoId_fkey" FOREIGN KEY ("formaPagamentoId") REFERENCES "public"."FormaPagamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RegistroImagem" ADD CONSTRAINT "RegistroImagem_dispositivoId_fkey" FOREIGN KEY ("dispositivoId") REFERENCES "public"."Dispositivo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ResultadoAnaliseIA" ADD CONSTRAINT "ResultadoAnaliseIA_registroImagemId_fkey" FOREIGN KEY ("registroImagemId") REFERENCES "public"."RegistroImagem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
