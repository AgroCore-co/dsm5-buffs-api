/*
  Warnings:

  - You are about to drop the `Alertas` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AlimRegistro` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AlimentacaoDef` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Bufalo` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CicloLactacao` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Coleta` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DadosLactacao` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DadosReproducao` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DadosSanitarios` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DadosZootecnicos` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Endereco` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EstoqueLeite` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Grupo` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Industria` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Lote` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MaterialGenetico` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Medicacoes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MovLote` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Propriedade` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Raca` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Usuario` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UsuarioPropriedade` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Alertas" DROP CONSTRAINT "Alertas_animal_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Alertas" DROP CONSTRAINT "Alertas_id_propriedade_fkey";

-- DropForeignKey
ALTER TABLE "public"."AlimRegistro" DROP CONSTRAINT "AlimRegistro_id_aliment_def_fkey";

-- DropForeignKey
ALTER TABLE "public"."AlimRegistro" DROP CONSTRAINT "AlimRegistro_id_grupo_fkey";

-- DropForeignKey
ALTER TABLE "public"."AlimRegistro" DROP CONSTRAINT "AlimRegistro_id_usuario_fkey";

-- DropForeignKey
ALTER TABLE "public"."AlimentacaoDef" DROP CONSTRAINT "AlimentacaoDef_id_propriedade_fkey";

-- DropForeignKey
ALTER TABLE "public"."Bufalo" DROP CONSTRAINT "Bufalo_id_grupo_fkey";

-- DropForeignKey
ALTER TABLE "public"."Bufalo" DROP CONSTRAINT "Bufalo_id_mae_fkey";

-- DropForeignKey
ALTER TABLE "public"."Bufalo" DROP CONSTRAINT "Bufalo_id_pai_fkey";

-- DropForeignKey
ALTER TABLE "public"."Bufalo" DROP CONSTRAINT "Bufalo_id_propriedade_fkey";

-- DropForeignKey
ALTER TABLE "public"."Bufalo" DROP CONSTRAINT "Bufalo_id_raca_fkey";

-- DropForeignKey
ALTER TABLE "public"."CicloLactacao" DROP CONSTRAINT "CicloLactacao_id_bufala_fkey";

-- DropForeignKey
ALTER TABLE "public"."CicloLactacao" DROP CONSTRAINT "CicloLactacao_id_propriedade_fkey";

-- DropForeignKey
ALTER TABLE "public"."Coleta" DROP CONSTRAINT "Coleta_id_funcionario_fkey";

-- DropForeignKey
ALTER TABLE "public"."Coleta" DROP CONSTRAINT "Coleta_id_industria_fkey";

-- DropForeignKey
ALTER TABLE "public"."Coleta" DROP CONSTRAINT "Coleta_id_propriedade_fkey";

-- DropForeignKey
ALTER TABLE "public"."DadosLactacao" DROP CONSTRAINT "DadosLactacao_id_bufala_fkey";

-- DropForeignKey
ALTER TABLE "public"."DadosLactacao" DROP CONSTRAINT "DadosLactacao_id_ciclo_lactacao_fkey";

-- DropForeignKey
ALTER TABLE "public"."DadosLactacao" DROP CONSTRAINT "DadosLactacao_id_propriedade_fkey";

-- DropForeignKey
ALTER TABLE "public"."DadosLactacao" DROP CONSTRAINT "DadosLactacao_id_usuario_fkey";

-- DropForeignKey
ALTER TABLE "public"."DadosReproducao" DROP CONSTRAINT "DadosReproducao_id_bufala_fkey";

-- DropForeignKey
ALTER TABLE "public"."DadosReproducao" DROP CONSTRAINT "DadosReproducao_id_bufalo_fkey";

-- DropForeignKey
ALTER TABLE "public"."DadosReproducao" DROP CONSTRAINT "DadosReproducao_id_ovulo_fkey";

-- DropForeignKey
ALTER TABLE "public"."DadosReproducao" DROP CONSTRAINT "DadosReproducao_id_propriedade_fkey";

-- DropForeignKey
ALTER TABLE "public"."DadosReproducao" DROP CONSTRAINT "DadosReproducao_id_semen_fkey";

-- DropForeignKey
ALTER TABLE "public"."DadosSanitarios" DROP CONSTRAINT "DadosSanitarios_id_bufalo_fkey";

-- DropForeignKey
ALTER TABLE "public"."DadosSanitarios" DROP CONSTRAINT "DadosSanitarios_id_medicao_fkey";

-- DropForeignKey
ALTER TABLE "public"."DadosSanitarios" DROP CONSTRAINT "DadosSanitarios_id_usuario_fkey";

-- DropForeignKey
ALTER TABLE "public"."DadosZootecnicos" DROP CONSTRAINT "DadosZootecnicos_id_bufalo_fkey";

-- DropForeignKey
ALTER TABLE "public"."DadosZootecnicos" DROP CONSTRAINT "DadosZootecnicos_id_usuario_fkey";

-- DropForeignKey
ALTER TABLE "public"."EstoqueLeite" DROP CONSTRAINT "EstoqueLeite_id_propriedade_fkey";

-- DropForeignKey
ALTER TABLE "public"."EstoqueLeite" DROP CONSTRAINT "EstoqueLeite_id_usuario_fkey";

-- DropForeignKey
ALTER TABLE "public"."Grupo" DROP CONSTRAINT "Grupo_id_propriedade_fkey";

-- DropForeignKey
ALTER TABLE "public"."Industria" DROP CONSTRAINT "Industria_id_propriedade_fkey";

-- DropForeignKey
ALTER TABLE "public"."Lote" DROP CONSTRAINT "Lote_id_propriedade_fkey";

-- DropForeignKey
ALTER TABLE "public"."MaterialGenetico" DROP CONSTRAINT "MaterialGenetico_id_bufalo_origem_fkey";

-- DropForeignKey
ALTER TABLE "public"."MaterialGenetico" DROP CONSTRAINT "MaterialGenetico_id_propriedade_fkey";

-- DropForeignKey
ALTER TABLE "public"."Medicacoes" DROP CONSTRAINT "Medicacoes_id_propriedade_fkey";

-- DropForeignKey
ALTER TABLE "public"."MovLote" DROP CONSTRAINT "MovLote_id_grupo_fkey";

-- DropForeignKey
ALTER TABLE "public"."MovLote" DROP CONSTRAINT "MovLote_id_lote_anterior_fkey";

-- DropForeignKey
ALTER TABLE "public"."MovLote" DROP CONSTRAINT "MovLote_id_lote_atual_fkey";

-- DropForeignKey
ALTER TABLE "public"."Propriedade" DROP CONSTRAINT "Propriedade_id_dono_fkey";

-- DropForeignKey
ALTER TABLE "public"."Propriedade" DROP CONSTRAINT "Propriedade_id_endereco_fkey";

-- DropForeignKey
ALTER TABLE "public"."Usuario" DROP CONSTRAINT "Usuario_id_endereco_fkey";

-- DropForeignKey
ALTER TABLE "public"."UsuarioPropriedade" DROP CONSTRAINT "UsuarioPropriedade_id_propriedade_fkey";

-- DropForeignKey
ALTER TABLE "public"."UsuarioPropriedade" DROP CONSTRAINT "UsuarioPropriedade_id_usuario_fkey";

-- DropTable
DROP TABLE "public"."Alertas";

-- DropTable
DROP TABLE "public"."AlimRegistro";

-- DropTable
DROP TABLE "public"."AlimentacaoDef";

-- DropTable
DROP TABLE "public"."Bufalo";

-- DropTable
DROP TABLE "public"."CicloLactacao";

-- DropTable
DROP TABLE "public"."Coleta";

-- DropTable
DROP TABLE "public"."DadosLactacao";

-- DropTable
DROP TABLE "public"."DadosReproducao";

-- DropTable
DROP TABLE "public"."DadosSanitarios";

-- DropTable
DROP TABLE "public"."DadosZootecnicos";

-- DropTable
DROP TABLE "public"."Endereco";

-- DropTable
DROP TABLE "public"."EstoqueLeite";

-- DropTable
DROP TABLE "public"."Grupo";

-- DropTable
DROP TABLE "public"."Industria";

-- DropTable
DROP TABLE "public"."Lote";

-- DropTable
DROP TABLE "public"."MaterialGenetico";

-- DropTable
DROP TABLE "public"."Medicacoes";

-- DropTable
DROP TABLE "public"."MovLote";

-- DropTable
DROP TABLE "public"."Propriedade";

-- DropTable
DROP TABLE "public"."Raca";

-- DropTable
DROP TABLE "public"."Usuario";

-- DropTable
DROP TABLE "public"."UsuarioPropriedade";

-- CreateTable
CREATE TABLE "public"."enderecos" (
    "id_endereco" BIGSERIAL NOT NULL,
    "pais" VARCHAR(50) NOT NULL,
    "estado" VARCHAR(50) NOT NULL,
    "cidade" VARCHAR(50) NOT NULL,
    "bairro" VARCHAR(50),
    "rua" VARCHAR(100),
    "cep" VARCHAR(10),
    "numero" VARCHAR(10),
    "ponto_referencia" VARCHAR(150),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "enderecos_pkey" PRIMARY KEY ("id_endereco")
);

-- CreateTable
CREATE TABLE "public"."racas" (
    "id_raca" BIGSERIAL NOT NULL,
    "nome" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "racas_pkey" PRIMARY KEY ("id_raca")
);

-- CreateTable
CREATE TABLE "public"."grupos" (
    "id_grupo" BIGSERIAL NOT NULL,
    "nome_grupo" VARCHAR(50) NOT NULL,
    "nivel_maturidade" VARCHAR(1),
    "color" VARCHAR(7),
    "id_propriedade" BIGINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grupos_pkey" PRIMARY KEY ("id_grupo")
);

-- CreateTable
CREATE TABLE "public"."alimentacao_defs" (
    "id_aliment_def" BIGSERIAL NOT NULL,
    "tipo_alimentacao" VARCHAR(50) NOT NULL,
    "descricao" VARCHAR(200),
    "id_propriedade" BIGINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alimentacao_defs_pkey" PRIMARY KEY ("id_aliment_def")
);

-- CreateTable
CREATE TABLE "public"."industrias" (
    "id_industria" BIGSERIAL NOT NULL,
    "nome" VARCHAR(20),
    "representante" VARCHAR(20),
    "contato" VARCHAR(20),
    "observacao" VARCHAR(50),
    "id_propriedade" BIGINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "industrias_pkey" PRIMARY KEY ("id_industria")
);

-- CreateTable
CREATE TABLE "public"."usuarios" (
    "id_usuario" BIGSERIAL NOT NULL,
    "auth_id" VARCHAR(100) NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "telefone" VARCHAR(15),
    "email" VARCHAR(100),
    "cargo" VARCHAR(50),
    "id_endereco" BIGINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id_usuario")
);

-- CreateTable
CREATE TABLE "public"."propriedades" (
    "id_propriedade" BIGSERIAL NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "id_dono" BIGINT,
    "id_endereco" BIGINT,
    "cnpj" VARCHAR(18) NOT NULL,
    "p_abcb" BOOLEAN,
    "tipo_manejo" VARCHAR(1),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "propriedades_pkey" PRIMARY KEY ("id_propriedade")
);

-- CreateTable
CREATE TABLE "public"."usuario_propriedade" (
    "id_usuario" BIGINT NOT NULL,
    "id_propriedade" BIGINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuario_propriedade_pkey" PRIMARY KEY ("id_usuario","id_propriedade")
);

-- CreateTable
CREATE TABLE "public"."lotes" (
    "id_lote" BIGSERIAL NOT NULL,
    "tipo_lote" VARCHAR(100),
    "nome_lote" VARCHAR(100) NOT NULL,
    "id_propriedade" BIGINT,
    "status" VARCHAR(20),
    "descricao" VARCHAR(200),
    "qtd_max" INTEGER,
    "geo_mapa" JSONB,
    "area_m2" DECIMAL(12,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lotes_pkey" PRIMARY KEY ("id_lote")
);

-- CreateTable
CREATE TABLE "public"."bufalos" (
    "id_bufalo" BIGSERIAL NOT NULL,
    "nome" VARCHAR(20),
    "brinco" VARCHAR(10),
    "microchip" TEXT,
    "dt_nascimento" TIMESTAMP(3),
    "nivel_maturidade" VARCHAR(1),
    "sexo" VARCHAR(1),
    "data_baixa" TIMESTAMP(3),
    "status" BOOLEAN,
    "motivo_inativo" VARCHAR(100),
    "id_raca" BIGINT,
    "id_propriedade" BIGINT,
    "id_grupo" BIGINT,
    "origem" VARCHAR(10),
    "brinco_original" VARCHAR(10),
    "registro_prov" VARCHAR(10),
    "registro_def" VARCHAR(10),
    "categoria" VARCHAR(2),
    "id_pai" BIGINT,
    "id_mae" BIGINT,
    "id_pai_semen" BIGINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bufalos_pkey" PRIMARY KEY ("id_bufalo")
);

-- CreateTable
CREATE TABLE "public"."mov_lotes" (
    "id_movimento" BIGSERIAL NOT NULL,
    "id_grupo" BIGINT,
    "id_lote_anterior" BIGINT,
    "id_lote_atual" BIGINT,
    "dt_entrada" TIMESTAMP(3) NOT NULL,
    "dt_saida" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mov_lotes_pkey" PRIMARY KEY ("id_movimento")
);

-- CreateTable
CREATE TABLE "public"."dados_zootecnicos" (
    "id_zootec" BIGSERIAL NOT NULL,
    "id_bufalo" BIGINT,
    "id_usuario" BIGINT,
    "peso" DECIMAL(7,2),
    "condicao_corporal" DECIMAL(4,2),
    "cor_pelagem" VARCHAR(30),
    "formato_chifre" VARCHAR(30),
    "porte_corporal" VARCHAR(30),
    "dt_registro" TIMESTAMP(3) NOT NULL,
    "tipo_pesagem" VARCHAR(50),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dados_zootecnicos_pkey" PRIMARY KEY ("id_zootec")
);

-- CreateTable
CREATE TABLE "public"."medicacoes" (
    "id_medicacao" BIGSERIAL NOT NULL,
    "tipo_tratamento" VARCHAR(30),
    "medicacao" VARCHAR(30),
    "descricao" VARCHAR(100),
    "id_propriedade" BIGINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medicacoes_pkey" PRIMARY KEY ("id_medicacao")
);

-- CreateTable
CREATE TABLE "public"."dados_sanitarios" (
    "id_sanit" BIGSERIAL NOT NULL,
    "id_bufalo" BIGINT,
    "id_usuario" BIGINT,
    "id_medicao" BIGINT,
    "dt_aplicacao" TIMESTAMP(3) NOT NULL,
    "dosagem" DECIMAL(8,2),
    "unidade_medida" VARCHAR(20),
    "doenca" VARCHAR(100),
    "necessita_retorno" BOOLEAN,
    "dt_retorno" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dados_sanitarios_pkey" PRIMARY KEY ("id_sanit")
);

-- CreateTable
CREATE TABLE "public"."material_genetico" (
    "id_material" BIGSERIAL NOT NULL,
    "tipo" VARCHAR(20),
    "origem" VARCHAR(20),
    "id_bufalo_origem" BIGINT,
    "fornecedor" VARCHAR(100),
    "data_coleta" TIMESTAMP(3),
    "id_propriedade" BIGINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "material_genetico_pkey" PRIMARY KEY ("id_material")
);

-- CreateTable
CREATE TABLE "public"."dados_reproducao" (
    "id_reproducao" BIGSERIAL NOT NULL,
    "id_ovulo" BIGINT,
    "id_semen" BIGINT,
    "id_bufala" BIGINT,
    "id_bufalo" BIGINT,
    "tipo_inseminacao" VARCHAR(50),
    "status" VARCHAR(20),
    "tipo_parto" VARCHAR(20),
    "dt_evento" TIMESTAMP(3) NOT NULL,
    "ocorrencia" VARCHAR(50),
    "id_propriedade" BIGINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dados_reproducao_pkey" PRIMARY KEY ("id_reproducao")
);

-- CreateTable
CREATE TABLE "public"."alim_registros" (
    "id_registro" BIGSERIAL NOT NULL,
    "id_grupo" BIGINT,
    "id_aliment_def" BIGINT,
    "id_usuario" BIGINT,
    "quantidade" DECIMAL(8,2),
    "unidade_medida" VARCHAR(20),
    "freq_dia" INTEGER,
    "dt_registro" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alim_registros_pkey" PRIMARY KEY ("id_registro")
);

-- CreateTable
CREATE TABLE "public"."coletas" (
    "id_coleta" BIGSERIAL NOT NULL,
    "id_industria" BIGINT,
    "resultado_teste" BOOLEAN,
    "observacao" VARCHAR(50),
    "quantidade" DECIMAL(8,3),
    "dt_coleta" TIMESTAMP(3),
    "id_funcionario" BIGINT,
    "id_propriedade" BIGINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coletas_pkey" PRIMARY KEY ("id_coleta")
);

-- CreateTable
CREATE TABLE "public"."estoque_leite" (
    "id_estoque" BIGSERIAL NOT NULL,
    "id_propriedade" BIGINT,
    "id_usuario" BIGINT,
    "quantidade" DECIMAL(10,3),
    "dt_registro" TIMESTAMP(3),
    "observacao" VARCHAR(50),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "estoque_leite_pkey" PRIMARY KEY ("id_estoque")
);

-- CreateTable
CREATE TABLE "public"."ciclos_lactacao" (
    "id_ciclo_lactacao" BIGSERIAL NOT NULL,
    "id_bufala" BIGINT NOT NULL,
    "dt_parto" TIMESTAMP(3) NOT NULL,
    "padrao_dias" INTEGER NOT NULL,
    "dt_secagem_prevista" TIMESTAMP(3),
    "dt_secagem_real" TIMESTAMP(3),
    "status" VARCHAR(20) NOT NULL DEFAULT 'Em Lactação',
    "observacao" TEXT,
    "id_propriedade" BIGINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ciclos_lactacao_pkey" PRIMARY KEY ("id_ciclo_lactacao")
);

-- CreateTable
CREATE TABLE "public"."dados_lactacao" (
    "id_lact" BIGSERIAL NOT NULL,
    "id_bufala" BIGINT,
    "id_usuario" BIGINT,
    "id_ciclo_lactacao" BIGINT,
    "qt_ordenha" DECIMAL(8,3),
    "periodo" VARCHAR(1),
    "ocorrencia" VARCHAR(50),
    "dt_ordenha" TIMESTAMP(3) NOT NULL,
    "id_propriedade" BIGINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dados_lactacao_pkey" PRIMARY KEY ("id_lact")
);

-- CreateTable
CREATE TABLE "public"."alertas" (
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
    "id_propriedade" BIGINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alertas_pkey" PRIMARY KEY ("id_alerta")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_auth_id_key" ON "public"."usuarios"("auth_id");

-- AddForeignKey
ALTER TABLE "public"."grupos" ADD CONSTRAINT "grupos_id_propriedade_fkey" FOREIGN KEY ("id_propriedade") REFERENCES "public"."propriedades"("id_propriedade") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."alimentacao_defs" ADD CONSTRAINT "alimentacao_defs_id_propriedade_fkey" FOREIGN KEY ("id_propriedade") REFERENCES "public"."propriedades"("id_propriedade") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."industrias" ADD CONSTRAINT "industrias_id_propriedade_fkey" FOREIGN KEY ("id_propriedade") REFERENCES "public"."propriedades"("id_propriedade") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."usuarios" ADD CONSTRAINT "usuarios_id_endereco_fkey" FOREIGN KEY ("id_endereco") REFERENCES "public"."enderecos"("id_endereco") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."propriedades" ADD CONSTRAINT "propriedades_id_endereco_fkey" FOREIGN KEY ("id_endereco") REFERENCES "public"."enderecos"("id_endereco") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."propriedades" ADD CONSTRAINT "propriedades_id_dono_fkey" FOREIGN KEY ("id_dono") REFERENCES "public"."usuarios"("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."usuario_propriedade" ADD CONSTRAINT "usuario_propriedade_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "public"."usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."usuario_propriedade" ADD CONSTRAINT "usuario_propriedade_id_propriedade_fkey" FOREIGN KEY ("id_propriedade") REFERENCES "public"."propriedades"("id_propriedade") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."lotes" ADD CONSTRAINT "lotes_id_propriedade_fkey" FOREIGN KEY ("id_propriedade") REFERENCES "public"."propriedades"("id_propriedade") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bufalos" ADD CONSTRAINT "bufalos_id_raca_fkey" FOREIGN KEY ("id_raca") REFERENCES "public"."racas"("id_raca") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bufalos" ADD CONSTRAINT "bufalos_id_propriedade_fkey" FOREIGN KEY ("id_propriedade") REFERENCES "public"."propriedades"("id_propriedade") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bufalos" ADD CONSTRAINT "bufalos_id_grupo_fkey" FOREIGN KEY ("id_grupo") REFERENCES "public"."grupos"("id_grupo") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bufalos" ADD CONSTRAINT "bufalos_id_pai_fkey" FOREIGN KEY ("id_pai") REFERENCES "public"."bufalos"("id_bufalo") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."bufalos" ADD CONSTRAINT "bufalos_id_mae_fkey" FOREIGN KEY ("id_mae") REFERENCES "public"."bufalos"("id_bufalo") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."mov_lotes" ADD CONSTRAINT "mov_lotes_id_grupo_fkey" FOREIGN KEY ("id_grupo") REFERENCES "public"."grupos"("id_grupo") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."mov_lotes" ADD CONSTRAINT "mov_lotes_id_lote_anterior_fkey" FOREIGN KEY ("id_lote_anterior") REFERENCES "public"."lotes"("id_lote") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."mov_lotes" ADD CONSTRAINT "mov_lotes_id_lote_atual_fkey" FOREIGN KEY ("id_lote_atual") REFERENCES "public"."lotes"("id_lote") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."dados_zootecnicos" ADD CONSTRAINT "dados_zootecnicos_id_bufalo_fkey" FOREIGN KEY ("id_bufalo") REFERENCES "public"."bufalos"("id_bufalo") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."dados_zootecnicos" ADD CONSTRAINT "dados_zootecnicos_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "public"."usuarios"("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."medicacoes" ADD CONSTRAINT "medicacoes_id_propriedade_fkey" FOREIGN KEY ("id_propriedade") REFERENCES "public"."propriedades"("id_propriedade") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."dados_sanitarios" ADD CONSTRAINT "dados_sanitarios_id_bufalo_fkey" FOREIGN KEY ("id_bufalo") REFERENCES "public"."bufalos"("id_bufalo") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."dados_sanitarios" ADD CONSTRAINT "dados_sanitarios_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "public"."usuarios"("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."dados_sanitarios" ADD CONSTRAINT "dados_sanitarios_id_medicao_fkey" FOREIGN KEY ("id_medicao") REFERENCES "public"."medicacoes"("id_medicacao") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."material_genetico" ADD CONSTRAINT "material_genetico_id_propriedade_fkey" FOREIGN KEY ("id_propriedade") REFERENCES "public"."propriedades"("id_propriedade") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."material_genetico" ADD CONSTRAINT "material_genetico_id_bufalo_origem_fkey" FOREIGN KEY ("id_bufalo_origem") REFERENCES "public"."bufalos"("id_bufalo") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."dados_reproducao" ADD CONSTRAINT "dados_reproducao_id_propriedade_fkey" FOREIGN KEY ("id_propriedade") REFERENCES "public"."propriedades"("id_propriedade") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."dados_reproducao" ADD CONSTRAINT "dados_reproducao_id_ovulo_fkey" FOREIGN KEY ("id_ovulo") REFERENCES "public"."material_genetico"("id_material") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."dados_reproducao" ADD CONSTRAINT "dados_reproducao_id_semen_fkey" FOREIGN KEY ("id_semen") REFERENCES "public"."material_genetico"("id_material") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."dados_reproducao" ADD CONSTRAINT "dados_reproducao_id_bufala_fkey" FOREIGN KEY ("id_bufala") REFERENCES "public"."bufalos"("id_bufalo") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."dados_reproducao" ADD CONSTRAINT "dados_reproducao_id_bufalo_fkey" FOREIGN KEY ("id_bufalo") REFERENCES "public"."bufalos"("id_bufalo") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."alim_registros" ADD CONSTRAINT "alim_registros_id_grupo_fkey" FOREIGN KEY ("id_grupo") REFERENCES "public"."grupos"("id_grupo") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."alim_registros" ADD CONSTRAINT "alim_registros_id_aliment_def_fkey" FOREIGN KEY ("id_aliment_def") REFERENCES "public"."alimentacao_defs"("id_aliment_def") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."alim_registros" ADD CONSTRAINT "alim_registros_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "public"."usuarios"("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."coletas" ADD CONSTRAINT "coletas_id_propriedade_fkey" FOREIGN KEY ("id_propriedade") REFERENCES "public"."propriedades"("id_propriedade") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."coletas" ADD CONSTRAINT "coletas_id_industria_fkey" FOREIGN KEY ("id_industria") REFERENCES "public"."industrias"("id_industria") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."coletas" ADD CONSTRAINT "coletas_id_funcionario_fkey" FOREIGN KEY ("id_funcionario") REFERENCES "public"."usuarios"("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."estoque_leite" ADD CONSTRAINT "estoque_leite_id_propriedade_fkey" FOREIGN KEY ("id_propriedade") REFERENCES "public"."propriedades"("id_propriedade") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."estoque_leite" ADD CONSTRAINT "estoque_leite_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "public"."usuarios"("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ciclos_lactacao" ADD CONSTRAINT "ciclos_lactacao_id_propriedade_fkey" FOREIGN KEY ("id_propriedade") REFERENCES "public"."propriedades"("id_propriedade") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ciclos_lactacao" ADD CONSTRAINT "ciclos_lactacao_id_bufala_fkey" FOREIGN KEY ("id_bufala") REFERENCES "public"."bufalos"("id_bufalo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."dados_lactacao" ADD CONSTRAINT "dados_lactacao_id_propriedade_fkey" FOREIGN KEY ("id_propriedade") REFERENCES "public"."propriedades"("id_propriedade") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."dados_lactacao" ADD CONSTRAINT "dados_lactacao_id_bufala_fkey" FOREIGN KEY ("id_bufala") REFERENCES "public"."bufalos"("id_bufalo") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."dados_lactacao" ADD CONSTRAINT "dados_lactacao_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "public"."usuarios"("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."dados_lactacao" ADD CONSTRAINT "dados_lactacao_id_ciclo_lactacao_fkey" FOREIGN KEY ("id_ciclo_lactacao") REFERENCES "public"."ciclos_lactacao"("id_ciclo_lactacao") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."alertas" ADD CONSTRAINT "alertas_id_propriedade_fkey" FOREIGN KEY ("id_propriedade") REFERENCES "public"."propriedades"("id_propriedade") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."alertas" ADD CONSTRAINT "alertas_animal_id_fkey" FOREIGN KEY ("animal_id") REFERENCES "public"."bufalos"("id_bufalo") ON DELETE RESTRICT ON UPDATE CASCADE;
