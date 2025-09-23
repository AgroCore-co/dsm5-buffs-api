-- CreateTable
CREATE TABLE "public"."Endereco" (
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

    CONSTRAINT "Endereco_pkey" PRIMARY KEY ("id_endereco")
);

-- CreateTable
CREATE TABLE "public"."Raca" (
    "id_raca" BIGSERIAL NOT NULL,
    "nome" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Raca_pkey" PRIMARY KEY ("id_raca")
);

-- CreateTable
CREATE TABLE "public"."Grupo" (
    "id_grupo" BIGSERIAL NOT NULL,
    "nome_grupo" VARCHAR(50) NOT NULL,
    "nivel_maturidade" VARCHAR(1),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Grupo_pkey" PRIMARY KEY ("id_grupo")
);

-- CreateTable
CREATE TABLE "public"."AlimentacaoDef" (
    "id_aliment_def" BIGSERIAL NOT NULL,
    "tipo_alimentacao" VARCHAR(50) NOT NULL,
    "descricao" VARCHAR(200),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AlimentacaoDef_pkey" PRIMARY KEY ("id_aliment_def")
);

-- CreateTable
CREATE TABLE "public"."Industria" (
    "id_industria" BIGSERIAL NOT NULL,
    "nome" VARCHAR(20),
    "representante" VARCHAR(20),
    "contato" VARCHAR(20),
    "observacao" VARCHAR(50),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Industria_pkey" PRIMARY KEY ("id_industria")
);

-- CreateTable
CREATE TABLE "public"."Usuario" (
    "id_usuario" BIGSERIAL NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "telefone" VARCHAR(15),
    "email" VARCHAR(100),
    "cargo" VARCHAR(50),
    "id_endereco" BIGINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id_usuario")
);

-- CreateTable
CREATE TABLE "public"."Propriedade" (
    "id_propriedade" BIGSERIAL NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "id_dono" BIGINT,
    "id_endereco" BIGINT,
    "cnpj" VARCHAR(18) NOT NULL,
    "p_abcb" BOOLEAN,
    "tipo_manejo" VARCHAR(1),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Propriedade_pkey" PRIMARY KEY ("id_propriedade")
);

-- CreateTable
CREATE TABLE "public"."Lote" (
    "id_lote" BIGSERIAL NOT NULL,
    "tipo_lote" VARCHAR(100),
    "nome_lote" VARCHAR(100) NOT NULL,
    "id_propriedade" BIGINT,
    "status" VARCHAR(20),
    "descricao" VARCHAR(200),
    "qtd_max" INTEGER,
    "geo_mapa" BYTEA,
    "area_m2" DECIMAL(12,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lote_pkey" PRIMARY KEY ("id_lote")
);

-- CreateTable
CREATE TABLE "public"."Bufalo" (
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
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bufalo_pkey" PRIMARY KEY ("id_bufalo")
);

-- CreateTable
CREATE TABLE "public"."MovLote" (
    "id_movimento" BIGSERIAL NOT NULL,
    "id_grupo" BIGINT,
    "id_lote_anterior" BIGINT,
    "id_lote_atual" BIGINT,
    "dt_entrada" TIMESTAMP(3) NOT NULL,
    "dt_saida" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MovLote_pkey" PRIMARY KEY ("id_movimento")
);

-- CreateTable
CREATE TABLE "public"."DadosZootecnicos" (
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

    CONSTRAINT "DadosZootecnicos_pkey" PRIMARY KEY ("id_zootec")
);

-- CreateTable
CREATE TABLE "public"."Medicacoes" (
    "id_medicacao" BIGSERIAL NOT NULL,
    "tipo_tratamento" VARCHAR(30),
    "medicacao" VARCHAR(30),
    "descricao" VARCHAR(100),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Medicacoes_pkey" PRIMARY KEY ("id_medicacao")
);

-- CreateTable
CREATE TABLE "public"."DadosSanitarios" (
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

    CONSTRAINT "DadosSanitarios_pkey" PRIMARY KEY ("id_sanit")
);

-- CreateTable
CREATE TABLE "public"."MaterialGenetico" (
    "id_material" BIGSERIAL NOT NULL,
    "tipo" VARCHAR(20),
    "origem" VARCHAR(20),
    "id_bufalo_origem" BIGINT,
    "fornecedor" VARCHAR(100),
    "data_coleta" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaterialGenetico_pkey" PRIMARY KEY ("id_material")
);

-- CreateTable
CREATE TABLE "public"."DadosReproducao" (
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
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DadosReproducao_pkey" PRIMARY KEY ("id_reproducao")
);

-- CreateTable
CREATE TABLE "public"."AlimRegistro" (
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

    CONSTRAINT "AlimRegistro_pkey" PRIMARY KEY ("id_registro")
);

-- CreateTable
CREATE TABLE "public"."Coleta" (
    "id_coleta" BIGSERIAL NOT NULL,
    "id_industria" BIGINT,
    "resultado_teste" BOOLEAN,
    "observacao" VARCHAR(50),
    "quantidade" DECIMAL(8,3),
    "dt_coleta" TIMESTAMP(3),
    "id_funcionario" BIGINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Coleta_pkey" PRIMARY KEY ("id_coleta")
);

-- CreateTable
CREATE TABLE "public"."EstoqueLeite" (
    "id_estoque" BIGSERIAL NOT NULL,
    "id_propriedade" BIGINT,
    "id_usuario" BIGINT,
    "quantidade" DECIMAL(10,3),
    "dt_registro" TIMESTAMP(3),
    "observacao" VARCHAR(50),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EstoqueLeite_pkey" PRIMARY KEY ("id_estoque")
);

-- CreateTable
CREATE TABLE "public"."CicloLactacao" (
    "id_ciclo_lactacao" BIGSERIAL NOT NULL,
    "id_bufala" BIGINT NOT NULL,
    "dt_parto" TIMESTAMP(3) NOT NULL,
    "padrao_dias" INTEGER NOT NULL,
    "dt_secagem_prevista" TIMESTAMP(3),
    "dt_secagem_real" TIMESTAMP(3),
    "status" VARCHAR(20) NOT NULL DEFAULT 'Em Lactação',
    "observacao" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CicloLactacao_pkey" PRIMARY KEY ("id_ciclo_lactacao")
);

-- CreateTable
CREATE TABLE "public"."DadosLactacao" (
    "id_lact" BIGSERIAL NOT NULL,
    "id_bufala" BIGINT,
    "id_usuario" BIGINT,
    "id_ciclo_lactacao" BIGINT,
    "qt_ordenha" DECIMAL(8,3),
    "periodo" VARCHAR(1),
    "ocorrencia" VARCHAR(50),
    "dt_ordenha" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DadosLactacao_pkey" PRIMARY KEY ("id_lact")
);

-- AddForeignKey
ALTER TABLE "public"."Usuario" ADD CONSTRAINT "Usuario_id_endereco_fkey" FOREIGN KEY ("id_endereco") REFERENCES "public"."Endereco"("id_endereco") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Propriedade" ADD CONSTRAINT "Propriedade_id_endereco_fkey" FOREIGN KEY ("id_endereco") REFERENCES "public"."Endereco"("id_endereco") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Propriedade" ADD CONSTRAINT "Propriedade_id_dono_fkey" FOREIGN KEY ("id_dono") REFERENCES "public"."Usuario"("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Lote" ADD CONSTRAINT "Lote_id_propriedade_fkey" FOREIGN KEY ("id_propriedade") REFERENCES "public"."Propriedade"("id_propriedade") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Bufalo" ADD CONSTRAINT "Bufalo_id_raca_fkey" FOREIGN KEY ("id_raca") REFERENCES "public"."Raca"("id_raca") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Bufalo" ADD CONSTRAINT "Bufalo_id_propriedade_fkey" FOREIGN KEY ("id_propriedade") REFERENCES "public"."Propriedade"("id_propriedade") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Bufalo" ADD CONSTRAINT "Bufalo_id_grupo_fkey" FOREIGN KEY ("id_grupo") REFERENCES "public"."Grupo"("id_grupo") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Bufalo" ADD CONSTRAINT "Bufalo_id_pai_fkey" FOREIGN KEY ("id_pai") REFERENCES "public"."Bufalo"("id_bufalo") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Bufalo" ADD CONSTRAINT "Bufalo_id_mae_fkey" FOREIGN KEY ("id_mae") REFERENCES "public"."Bufalo"("id_bufalo") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MovLote" ADD CONSTRAINT "MovLote_id_grupo_fkey" FOREIGN KEY ("id_grupo") REFERENCES "public"."Grupo"("id_grupo") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MovLote" ADD CONSTRAINT "MovLote_id_lote_anterior_fkey" FOREIGN KEY ("id_lote_anterior") REFERENCES "public"."Lote"("id_lote") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MovLote" ADD CONSTRAINT "MovLote_id_lote_atual_fkey" FOREIGN KEY ("id_lote_atual") REFERENCES "public"."Lote"("id_lote") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DadosZootecnicos" ADD CONSTRAINT "DadosZootecnicos_id_bufalo_fkey" FOREIGN KEY ("id_bufalo") REFERENCES "public"."Bufalo"("id_bufalo") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DadosZootecnicos" ADD CONSTRAINT "DadosZootecnicos_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "public"."Usuario"("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DadosSanitarios" ADD CONSTRAINT "DadosSanitarios_id_bufalo_fkey" FOREIGN KEY ("id_bufalo") REFERENCES "public"."Bufalo"("id_bufalo") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DadosSanitarios" ADD CONSTRAINT "DadosSanitarios_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "public"."Usuario"("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DadosSanitarios" ADD CONSTRAINT "DadosSanitarios_id_medicao_fkey" FOREIGN KEY ("id_medicao") REFERENCES "public"."Medicacoes"("id_medicacao") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MaterialGenetico" ADD CONSTRAINT "MaterialGenetico_id_bufalo_origem_fkey" FOREIGN KEY ("id_bufalo_origem") REFERENCES "public"."Bufalo"("id_bufalo") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DadosReproducao" ADD CONSTRAINT "DadosReproducao_id_ovulo_fkey" FOREIGN KEY ("id_ovulo") REFERENCES "public"."MaterialGenetico"("id_material") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DadosReproducao" ADD CONSTRAINT "DadosReproducao_id_semen_fkey" FOREIGN KEY ("id_semen") REFERENCES "public"."MaterialGenetico"("id_material") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DadosReproducao" ADD CONSTRAINT "DadosReproducao_id_bufala_fkey" FOREIGN KEY ("id_bufala") REFERENCES "public"."Bufalo"("id_bufalo") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DadosReproducao" ADD CONSTRAINT "DadosReproducao_id_bufalo_fkey" FOREIGN KEY ("id_bufalo") REFERENCES "public"."Bufalo"("id_bufalo") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AlimRegistro" ADD CONSTRAINT "AlimRegistro_id_grupo_fkey" FOREIGN KEY ("id_grupo") REFERENCES "public"."Grupo"("id_grupo") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AlimRegistro" ADD CONSTRAINT "AlimRegistro_id_aliment_def_fkey" FOREIGN KEY ("id_aliment_def") REFERENCES "public"."AlimentacaoDef"("id_aliment_def") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AlimRegistro" ADD CONSTRAINT "AlimRegistro_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "public"."Usuario"("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Coleta" ADD CONSTRAINT "Coleta_id_industria_fkey" FOREIGN KEY ("id_industria") REFERENCES "public"."Industria"("id_industria") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Coleta" ADD CONSTRAINT "Coleta_id_funcionario_fkey" FOREIGN KEY ("id_funcionario") REFERENCES "public"."Usuario"("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EstoqueLeite" ADD CONSTRAINT "EstoqueLeite_id_propriedade_fkey" FOREIGN KEY ("id_propriedade") REFERENCES "public"."Propriedade"("id_propriedade") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EstoqueLeite" ADD CONSTRAINT "EstoqueLeite_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "public"."Usuario"("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CicloLactacao" ADD CONSTRAINT "CicloLactacao_id_bufala_fkey" FOREIGN KEY ("id_bufala") REFERENCES "public"."Bufalo"("id_bufalo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DadosLactacao" ADD CONSTRAINT "DadosLactacao_id_bufala_fkey" FOREIGN KEY ("id_bufala") REFERENCES "public"."Bufalo"("id_bufalo") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DadosLactacao" ADD CONSTRAINT "DadosLactacao_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "public"."Usuario"("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DadosLactacao" ADD CONSTRAINT "DadosLactacao_id_ciclo_lactacao_fkey" FOREIGN KEY ("id_ciclo_lactacao") REFERENCES "public"."CicloLactacao"("id_ciclo_lactacao") ON DELETE SET NULL ON UPDATE CASCADE;
