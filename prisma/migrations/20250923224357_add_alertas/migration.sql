-- CreateEnum
CREATE TYPE "public"."NichoAlerta" AS ENUM ('CLINICO', 'SANITARIO', 'REPRODUCAO', 'MANEJO');

-- CreateEnum
CREATE TYPE "public"."PrioridadeAlerta" AS ENUM ('BAIXA', 'MEDIA', 'ALTA');

-- DropForeignKey
ALTER TABLE "public"."Bufalo" DROP CONSTRAINT "Bufalo_id_mae_fkey";

-- DropForeignKey
ALTER TABLE "public"."Bufalo" DROP CONSTRAINT "Bufalo_id_pai_fkey";

-- CreateTable
CREATE TABLE "public"."Alertas" (
    "id_alerta" BIGSERIAL NOT NULL,
    "animal_id" BIGINT NOT NULL,
    "grupo" VARCHAR(100) NOT NULL,
    "localizacao" VARCHAR(100) NOT NULL,
    "motivo" TEXT NOT NULL,
    "nicho" "public"."NichoAlerta" NOT NULL,
    "data_alerta" TIMESTAMP(3) NOT NULL,
    "prioridade" "public"."PrioridadeAlerta" NOT NULL,
    "observacao" TEXT,
    "visto" BOOLEAN NOT NULL DEFAULT false,
    "id_evento_origem" BIGINT,
    "tipo_evento_origem" VARCHAR(50),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Alertas_pkey" PRIMARY KEY ("id_alerta")
);

-- AddForeignKey
ALTER TABLE "public"."Bufalo" ADD CONSTRAINT "Bufalo_id_pai_fkey" FOREIGN KEY ("id_pai") REFERENCES "public"."Bufalo"("id_bufalo") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."Bufalo" ADD CONSTRAINT "Bufalo_id_mae_fkey" FOREIGN KEY ("id_mae") REFERENCES "public"."Bufalo"("id_bufalo") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."Alertas" ADD CONSTRAINT "Alertas_animal_id_fkey" FOREIGN KEY ("animal_id") REFERENCES "public"."Bufalo"("id_bufalo") ON DELETE RESTRICT ON UPDATE CASCADE;
