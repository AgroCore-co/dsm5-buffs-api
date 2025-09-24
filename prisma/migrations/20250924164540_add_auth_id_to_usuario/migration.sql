/*
  Warnings:

  - A unique constraint covering the columns `[auth_id]` on the table `Usuario` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `auth_id` to the `Usuario` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Usuario" ADD COLUMN     "auth_id" VARCHAR(100) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_auth_id_key" ON "public"."Usuario"("auth_id");
