/*
  Warnings:

  - The `geo_mapa` column on the `Lote` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "public"."Alertas" ADD COLUMN     "id_propriedade" BIGINT;

-- AlterTable
ALTER TABLE "public"."AlimentacaoDef" ADD COLUMN     "id_propriedade" BIGINT;

-- AlterTable
ALTER TABLE "public"."CicloLactacao" ADD COLUMN     "id_propriedade" BIGINT;

-- AlterTable
ALTER TABLE "public"."Coleta" ADD COLUMN     "id_propriedade" BIGINT;

-- AlterTable
ALTER TABLE "public"."DadosLactacao" ADD COLUMN     "id_propriedade" BIGINT;

-- AlterTable
ALTER TABLE "public"."DadosReproducao" ADD COLUMN     "id_propriedade" BIGINT;

-- AlterTable
ALTER TABLE "public"."Grupo" ADD COLUMN     "color" VARCHAR(7),
ADD COLUMN     "id_propriedade" BIGINT;

-- AlterTable
ALTER TABLE "public"."Industria" ADD COLUMN     "id_propriedade" BIGINT;

-- AlterTable
ALTER TABLE "public"."Lote" DROP COLUMN "geo_mapa",
ADD COLUMN     "geo_mapa" JSONB;

-- AlterTable
ALTER TABLE "public"."MaterialGenetico" ADD COLUMN     "id_propriedade" BIGINT;

-- AlterTable
ALTER TABLE "public"."Medicacoes" ADD COLUMN     "id_propriedade" BIGINT;

-- AddForeignKey
ALTER TABLE "public"."Grupo" ADD CONSTRAINT "Grupo_id_propriedade_fkey" FOREIGN KEY ("id_propriedade") REFERENCES "public"."Propriedade"("id_propriedade") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AlimentacaoDef" ADD CONSTRAINT "AlimentacaoDef_id_propriedade_fkey" FOREIGN KEY ("id_propriedade") REFERENCES "public"."Propriedade"("id_propriedade") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Industria" ADD CONSTRAINT "Industria_id_propriedade_fkey" FOREIGN KEY ("id_propriedade") REFERENCES "public"."Propriedade"("id_propriedade") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Medicacoes" ADD CONSTRAINT "Medicacoes_id_propriedade_fkey" FOREIGN KEY ("id_propriedade") REFERENCES "public"."Propriedade"("id_propriedade") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MaterialGenetico" ADD CONSTRAINT "MaterialGenetico_id_propriedade_fkey" FOREIGN KEY ("id_propriedade") REFERENCES "public"."Propriedade"("id_propriedade") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DadosReproducao" ADD CONSTRAINT "DadosReproducao_id_propriedade_fkey" FOREIGN KEY ("id_propriedade") REFERENCES "public"."Propriedade"("id_propriedade") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Coleta" ADD CONSTRAINT "Coleta_id_propriedade_fkey" FOREIGN KEY ("id_propriedade") REFERENCES "public"."Propriedade"("id_propriedade") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CicloLactacao" ADD CONSTRAINT "CicloLactacao_id_propriedade_fkey" FOREIGN KEY ("id_propriedade") REFERENCES "public"."Propriedade"("id_propriedade") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DadosLactacao" ADD CONSTRAINT "DadosLactacao_id_propriedade_fkey" FOREIGN KEY ("id_propriedade") REFERENCES "public"."Propriedade"("id_propriedade") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Alertas" ADD CONSTRAINT "Alertas_id_propriedade_fkey" FOREIGN KEY ("id_propriedade") REFERENCES "public"."Propriedade"("id_propriedade") ON DELETE SET NULL ON UPDATE CASCADE;
