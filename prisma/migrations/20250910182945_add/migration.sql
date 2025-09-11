/*
  Warnings:

  - The `plano` column on the `Licenca` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "public"."TipoLicenca" AS ENUM ('BASICO', 'EMPRESARIAL', 'PREMIUM');

-- AlterTable
ALTER TABLE "public"."Licenca" DROP COLUMN "plano",
ADD COLUMN     "plano" "public"."TipoLicenca" NOT NULL DEFAULT 'BASICO';
