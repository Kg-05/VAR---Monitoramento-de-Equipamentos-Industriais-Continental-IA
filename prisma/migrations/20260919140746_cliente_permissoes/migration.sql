-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "permissaoAlertas" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "permissaoGestao" BOOLEAN NOT NULL DEFAULT true;
