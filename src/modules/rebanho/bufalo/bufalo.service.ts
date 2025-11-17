import { Injectable, NotFoundException, InternalServerErrorException, BadRequestException, Logger } from '@nestjs/common';
import { SupabaseService } from '../../../core/supabase/supabase.service';
import { CreateBufaloDto } from './dto/create-bufalo.dto';
import { UpdateBufaloDto } from './dto/update-bufalo.dto';
import { UpdateGrupoBufaloDto } from './dto/update-grupo-bufalo.dto';
import { FiltroBufaloDto } from './dto/filtro-bufalo.dto';
import { GenealogiaService } from '../../reproducao/genealogia/genealogia.service';
import { PaginationDto, PaginatedResponse } from '../../../core/dto/pagination.dto';
import { createPaginatedResponse, calculatePaginationParams } from '../../../core/utils/pagination.utils';
import { formatDateFields, formatDateFieldsArray } from '../../../core/utils/date-formatter.utils';
import { ISoftDelete } from '../../../core/interfaces/soft-delete.interface';

import { BufaloRepository } from './repositories/bufalo.repository';
import { BufaloMaturidadeService } from './services/bufalo-maturidade.service';
import { BufaloCategoriaService } from './services/bufalo-categoria.service';
import { BufaloFiltrosService } from './services/bufalo-filtros.service';

@Injectable()
export class BufaloService implements ISoftDelete {
  private readonly logger = new Logger(BufaloService.name);
  private readonly tableName = 'bufalo';

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly genealogiaService: GenealogiaService,
    private readonly bufaloRepo: BufaloRepository,
    private readonly maturidadeService: BufaloMaturidadeService,
    private readonly categoriaService: BufaloCategoriaService,
    private readonly filtrosService: BufaloFiltrosService,
  ) {}

  // ==================== AUTENTICAÇÃO E AUTORIZAÇÃO ====================

  /**
   * Obtém ID do usuário a partir do email.
   */
  private async getUserId(user: any): Promise<number> {
    const supabase = this.supabaseService.getAdminClient();
    const { data: perfilUsuario, error } = await supabase.from('usuario').select('id_usuario').eq('email', user.email).single();

    if (error || !perfilUsuario) {
      throw new NotFoundException('Perfil de usuário não encontrado.');
    }
    return perfilUsuario.id_usuario;
  }

  /**
   * Busca todas as propriedades vinculadas ao usuário (como dono OU funcionário).
   */
  private async getUserPropriedades(userId: number): Promise<string[]> {
    const supabase = this.supabaseService.getAdminClient();

    // 1. Busca propriedades onde o usuário é DONO
    const { data: propriedadesComoDono, error: errorDono } = await supabase.from('propriedade').select('id_propriedade').eq('id_dono', userId);

    // 2. Busca propriedades onde o usuário é FUNCIONÁRIO
    const { data: propriedadesComoFuncionario, error: errorFuncionario } = await supabase
      .from('usuariopropriedade')
      .select('id_propriedade')
      .eq('id_usuario', userId);

    if (errorDono) {
      this.logger.error('Erro ao buscar propriedades onde o usuário é DONO.', errorDono);
      throw new InternalServerErrorException(`Falha ao buscar propriedades do usuário (como dono): ${errorDono.message}`);
    }

    if (errorFuncionario) {
      this.logger.error('Erro ao buscar propriedades onde o usuário é FUNCIONÁRIO.', errorFuncionario);
      throw new InternalServerErrorException(`Falha ao buscar propriedades do usuário (como funcionário): ${errorFuncionario.message}`);
    }

    // 3. Combina ambas as listas
    const todasPropriedades = [...(propriedadesComoDono || []), ...(propriedadesComoFuncionario || [])];

    // Remove duplicatas
    const propriedadesUnicas = Array.from(new Set(todasPropriedades.map((p) => p.id_propriedade)));

    if (propriedadesUnicas.length === 0) {
      throw new NotFoundException('Usuário não está associado a nenhuma propriedade.');
    }

    return propriedadesUnicas;
  }

  /**
   * Valida se o usuário tem acesso ao búfalo através das propriedades vinculadas.
   */
  private async validateBufaloAccess(bufaloId: string, userId: number): Promise<void> {
    const propriedadesUsuario = await this.getUserPropriedades(userId);
    const supabase = this.supabaseService.getAdminClient();

    const { data: bufalo, error: bufaloError } = await supabase
      .from(this.tableName)
      .select('id_propriedade')
      .eq('id_bufalo', bufaloId)
      .in('id_propriedade', propriedadesUsuario)
      .single();

    if (bufaloError || !bufalo) {
      throw new NotFoundException(`Búfalo com ID ${bufaloId} não encontrado nas propriedades vinculadas ao usuário.`);
    }
  }

  /**
   * Valida se o usuário tem acesso a uma propriedade específica.
   */
  private async validatePropriedadeAccess(id_propriedade: string, userId: number): Promise<void> {
    const propriedadesUsuario = await this.getUserPropriedades(userId);

    if (!propriedadesUsuario.includes(id_propriedade)) {
      throw new NotFoundException(`Propriedade com ID ${id_propriedade} não encontrada ou você não tem acesso a ela.`);
    }
  }

  /**
   * Valida se o grupo existe e se o usuário tem acesso através das propriedades vinculadas.
   */
  private async validateGrupoAccess(id_grupo: string, userId: number): Promise<void> {
    const propriedadesUsuario = await this.getUserPropriedades(userId);
    const supabase = this.supabaseService.getAdminClient();

    const { data: grupo, error } = await supabase
      .from('grupo')
      .select('id_grupo, id_propriedade')
      .eq('id_grupo', id_grupo)
      .in('id_propriedade', propriedadesUsuario)
      .single();

    if (error || !grupo) {
      throw new NotFoundException(`Grupo com ID ${id_grupo} não encontrado ou você não tem acesso a ele.`);
    }
  }

  // ==================== CRUD BÁSICO ====================

  /**
   * Cria novo búfalo com cálculo automático de maturidade e categoria ABCB.
   */
  async create(createDto: CreateBufaloDto, user: any) {
    const userId = await this.getUserId(user);

    // Valida acesso à propriedade
    await this.validatePropriedadeAccess(createDto.id_propriedade, userId);

    try {
      // 1. Processa maturidade automaticamente
      const dadosComMaturidade = this.maturidadeService.processarDadosMaturidade(createDto);

      // 2. Calcula categoria ABCB se tiver genealogia
      let dadosFinais = { ...dadosComMaturidade };

      if (createDto.id_pai || createDto.id_mae) {
        // Cria búfalo temporário para construir árvore
        const bufaloTemp = {
          id_bufalo: 'temp',
          id_pai: createDto.id_pai,
          id_mae: createDto.id_mae,
          id_raca: createDto.id_raca,
        };

        const arvoreGenealogica = await this.genealogiaService.construirArvoreParaCategoria(bufaloTemp.id_bufalo, 4);

        if (arvoreGenealogica) {
          // Verifica se propriedade participa ABCB
          const supabase = this.supabaseService.getAdminClient();
          const { data: propriedade } = await supabase
            .from('propriedade')
            .select('participa_abcb')
            .eq('id_propriedade', createDto.id_propriedade)
            .single();

          const categoria = this.categoriaService.processarCategoriaABCB(arvoreGenealogica, propriedade?.participa_abcb || false);
          dadosFinais = { ...dadosFinais, categoria };
        }
      }

      // 3. Cria no banco

      const response = await this.bufaloRepo.create(dadosFinais);

      if (response.error) {
        throw new InternalServerErrorException(`Falha ao criar búfalo: ${response.error.message}`);
      }

      this.logger.log(`✅ Búfalo criado: ${response.data.nome || response.data.brinco}`);
      return formatDateFields(response.data);
    } catch (error) {
      this.logger.error('Erro ao criar búfalo:', error);
      throw error;
    }
  }

  /**
   * Lista todos os búfalos das propriedades do usuário com paginação.
   * Exclui búfalos removidos logicamente (deleted_at não nulo).
   */
  async findAll(user: any, paginationDto: PaginationDto = {}): Promise<PaginatedResponse<any>> {
    const { page = 1, limit = 10 } = paginationDto;
    const { offset } = calculatePaginationParams(page, limit);

    const userId = await this.getUserId(user);
    const propriedadesUsuario = await this.getUserPropriedades(userId);

    // Delega para service de filtros (propriedades é array, repo aceita)
    const resultado = await this.filtrosService.filtrarBufalos(
      {
        id_propriedade: propriedadesUsuario.length === 1 ? propriedadesUsuario[0] : undefined,
        status: true,
      },
      { offset, limit },
    );

    // Se tem múltiplas propriedades, filtra manualmente
    let dadosFiltrados = resultado.data;
    let totalFiltrado = resultado.total;

    if (propriedadesUsuario.length > 1) {
      // Busca de todas as propriedades
      const todasPromises = propriedadesUsuario.map((id_prop) =>
        this.filtrosService.filtrarBufalos({ id_propriedade: id_prop, status: true }, { offset: 0, limit: 10000 }),
      );
      const todosResultados = await Promise.all(todasPromises);
      const todosBufalos = todosResultados.flatMap((r) => r.data);

      // Pagina manualmente
      dadosFiltrados = todosBufalos.slice(offset, offset + limit);
      totalFiltrado = todosBufalos.length;
    }

    // Filtra búfalos não deletados
    const bufalosAtivos = dadosFiltrados.filter((b) => !b.deleted_at);

    // Atualiza maturidade automaticamente
    await this.maturidadeService.atualizarMaturidadeSeNecessario(bufalosAtivos);

    const formattedData = formatDateFieldsArray(bufalosAtivos);
    return createPaginatedResponse(formattedData, bufalosAtivos.length, page, limit);
  }

  /**
   * Busca búfalo por ID.
   */
  async findOne(id: string, user: any) {
    const userId = await this.getUserId(user);

    // Valida acesso
    await this.validateBufaloAccess(id, userId);

    // Busca dados
    const bufalo = await this.filtrosService.buscarPorId(id);

    if (!bufalo) {
      throw new NotFoundException(`Búfalo com ID ${id} não encontrado.`);
    }

    // Atualiza maturidade automaticamente
    await this.maturidadeService.atualizarMaturidadeSeNecessario([bufalo]);

    return formatDateFields(bufalo);
  }

  /**
   * Busca búfalos por propriedade com paginação.
   */
  async findByPropriedade(id_propriedade: string, user: any, paginationDto: PaginationDto = {}): Promise<PaginatedResponse<any>> {
    const { page = 1, limit = 10 } = paginationDto;
    const { offset } = calculatePaginationParams(page, limit);

    const userId = await this.getUserId(user);

    // Valida acesso à propriedade
    await this.validatePropriedadeAccess(id_propriedade, userId);

    // Delega para service de filtros
    const resultado = await this.filtrosService.buscarPorPropriedade(id_propriedade, { offset, limit });

    // Atualiza maturidade
    await this.maturidadeService.atualizarMaturidadeSeNecessario(resultado.data);

    const formattedData = formatDateFieldsArray(resultado.data);
    return createPaginatedResponse(formattedData, resultado.total, page, limit);
  }

  /**
   * Busca búfalos por raça em uma propriedade.
   */
  async findByRaca(id_raca: string, id_propriedade: string, user: any, paginationDto: PaginationDto = {}): Promise<PaginatedResponse<any>> {
    const { page = 1, limit = 10 } = paginationDto;
    const { offset } = calculatePaginationParams(page, limit);

    const userId = await this.getUserId(user);

    // Valida acesso à propriedade
    await this.validatePropriedadeAccess(id_propriedade, userId);

    // Delega para service de filtros
    const resultado = await this.filtrosService.buscarPorPropriedadeERaca(id_propriedade, id_raca, { offset, limit });

    // Atualiza maturidade
    await this.maturidadeService.atualizarMaturidadeSeNecessario(resultado.data);

    const formattedData = formatDateFieldsArray(resultado.data);
    return createPaginatedResponse(formattedData, resultado.total, page, limit);
  }

  /**
   * Busca búfalos por sexo em uma propriedade.
   */
  async findBySexo(sexo: string, id_propriedade: string, user: any, paginationDto: PaginationDto = {}): Promise<PaginatedResponse<any>> {
    const { page = 1, limit = 10 } = paginationDto;
    const { offset } = calculatePaginationParams(page, limit);

    const userId = await this.getUserId(user);

    // Valida acesso
    await this.validatePropriedadeAccess(id_propriedade, userId);

    // Delega para service de filtros
    const resultado = await this.filtrosService.buscarPorPropriedadeESexo(id_propriedade, sexo as any, { offset, limit });

    // Atualiza maturidade
    await this.maturidadeService.atualizarMaturidadeSeNecessario(resultado.data);

    const formattedData = formatDateFieldsArray(resultado.data);
    return createPaginatedResponse(formattedData, resultado.total, page, limit);
  }

  /**
   * Busca búfalos por nível de maturidade.
   */
  async findByMaturidade(
    nivel_maturidade: string,
    id_propriedade: string,
    user: any,
    paginationDto: PaginationDto = {},
  ): Promise<PaginatedResponse<any>> {
    const { page = 1, limit = 10 } = paginationDto;
    const { offset } = calculatePaginationParams(page, limit);

    const userId = await this.getUserId(user);

    // Valida acesso
    await this.validatePropriedadeAccess(id_propriedade, userId);

    // Delega para service de filtros
    const resultado = await this.filtrosService.buscarPorPropriedadeEMaturidade(id_propriedade, nivel_maturidade as any, { offset, limit });

    // Atualiza maturidade
    await this.maturidadeService.atualizarMaturidadeSeNecessario(resultado.data);

    const formattedData = formatDateFieldsArray(resultado.data);
    return createPaginatedResponse(formattedData, resultado.total, page, limit);
  }

  /**
   * Busca búfalos por grupo de manejo.
   * Retorna todos os búfalos ativos associados ao grupo específico.
   */
  async findByGrupo(id_grupo: string, user: any, paginationDto: PaginationDto = {}): Promise<PaginatedResponse<any>> {
    const { page = 1, limit = 10 } = paginationDto;
    const { offset } = calculatePaginationParams(page, limit);

    const userId = await this.getUserId(user);

    // Valida se o grupo existe e se o usuário tem acesso
    await this.validateGrupoAccess(id_grupo, userId);

    // Delega para service de filtros
    const resultado = await this.filtrosService.buscarPorGrupo(id_grupo, { offset, limit });

    // Atualiza maturidade
    await this.maturidadeService.atualizarMaturidadeSeNecessario(resultado.data);

    const formattedData = formatDateFieldsArray(resultado.data);
    return createPaginatedResponse(formattedData, resultado.total, page, limit);
  }

  /**
   * Busca búfalos com filtros combinados.
   * Compatibilidade com controller: aceita id_propriedade como primeiro parâmetro.
   */
  async findByFiltros(
    id_propriedade: string,
    filtroDto: FiltroBufaloDto,
    user: any,
    paginationDto: PaginationDto = {},
  ): Promise<PaginatedResponse<any>> {
    const { page = 1, limit = 10 } = paginationDto;
    const { offset } = calculatePaginationParams(page, limit);

    const userId = await this.getUserId(user);
    await this.validatePropriedadeAccess(id_propriedade, userId);

    // Filtra com os parâmetros fornecidos
    const resultado = await this.filtrosService.filtrarBufalos(
      {
        id_propriedade,
        id_raca: filtroDto.id_raca,
        sexo: filtroDto.sexo,
        nivel_maturidade: filtroDto.nivel_maturidade,
        status: filtroDto.status !== undefined ? filtroDto.status : true,
        brinco: filtroDto.brinco,
      },
      { offset, limit },
    );

    // Atualiza maturidade
    await this.maturidadeService.atualizarMaturidadeSeNecessario(resultado.data);

    const formattedData = formatDateFieldsArray(resultado.data);
    return createPaginatedResponse(formattedData, resultado.total, page, limit);
  }

  /**
   * Busca búfalo por microchip.
   */
  async findByMicrochip(microchip: string, user: any) {
    const userId = await this.getUserId(user);
    const propriedadesUsuario = await this.getUserPropriedades(userId);

    // Delega para service de filtros
    const bufalo = await this.filtrosService.buscarPorMicrochip(microchip, propriedadesUsuario);

    if (!bufalo) {
      throw new NotFoundException(`Búfalo com microchip ${microchip} não encontrado nas suas propriedades.`);
    }

    // Atualiza maturidade
    await this.maturidadeService.atualizarMaturidadeSeNecessario([bufalo]);

    return formatDateFields(bufalo);
  }

  /**
   * Atualiza búfalo.
   */
  async update(id: string, updateDto: UpdateBufaloDto, user: any) {
    const userId = await this.getUserId(user);

    // Valida acesso
    await this.validateBufaloAccess(id, userId);

    // Se mudou data de nascimento ou sexo, recalcula maturidade
    let dadosAtualizados = { ...updateDto };

    if (updateDto.dt_nascimento || updateDto.sexo) {
      // Busca dados atuais
      const bufaloAtual = await this.filtrosService.buscarPorId(id);

      const dadosCompletos = {
        ...bufaloAtual,
        ...updateDto,
      };

      dadosAtualizados = this.maturidadeService.processarDadosMaturidade(dadosCompletos);
    }

    // Atualiza no banco
    const response = await this.bufaloRepo.update(id, dadosAtualizados);

    if (response.error) {
      throw new InternalServerErrorException(`Falha ao atualizar búfalo: ${response.error.message}`);
    }

    this.logger.log(`✅ Búfalo atualizado: ${id}`);
    return formatDateFields(response.data);
  }

  /**
   * Remove búfalo (soft delete).
   * Define deleted_at para a data/hora atual.
   */
  async remove(id: string, user: any) {
    return this.softDelete(id, user);
  }

  /**
   * Soft delete: marca búfalo como removido sem deletar do banco.
   */
  async softDelete(id: string, user: any) {
    const userId = await this.getUserId(user);

    // Valida acesso
    await this.validateBufaloAccess(id, userId);

    // Verifica se tem descendentes
    const temDescendentes = await this.bufaloRepo.hasOffspring(id);

    if (temDescendentes) {
      throw new BadRequestException('Não é possível excluir este búfalo pois ele possui descendentes registrados.');
    }

    // Marca como deletado (soft delete)
    const supabase = this.supabaseService.getAdminClient();
    const { data, error } = await supabase
      .from(this.tableName)
      .update({ deleted_at: new Date().toISOString() })
      .eq('id_bufalo', id)
      .select()
      .single();

    if (error) {
      throw new InternalServerErrorException(`Falha ao remover búfalo: ${error.message}`);
    }

    this.logger.log(`Búfalo removido (soft delete): ${id}`);
    return {
      message: 'Búfalo removido com sucesso (soft delete).',
      data: formatDateFields(data),
    };
  }

  /**
   * Restaura búfalo removido logicamente.
   */
  async restore(id: string, user: any) {
    const userId = await this.getUserId(user);

    // Valida acesso
    await this.validateBufaloAccess(id, userId);

    // Verifica se está deletado
    const supabase = this.supabaseService.getAdminClient();
    const { data: bufalo } = await supabase.from(this.tableName).select('deleted_at').eq('id_bufalo', id).single();

    if (!bufalo?.deleted_at) {
      throw new BadRequestException('Este búfalo não está removido.');
    }

    // Restaura (remove deleted_at)
    const { data, error } = await supabase.from(this.tableName).update({ deleted_at: null }).eq('id_bufalo', id).select().single();

    if (error) {
      throw new InternalServerErrorException(`Falha ao restaurar búfalo: ${error.message}`);
    }

    this.logger.log(`Búfalo restaurado: ${id}`);
    return {
      message: 'Búfalo restaurado com sucesso.',
      data: formatDateFields(data),
    };
  }

  /**
   * Lista todos os búfalos incluindo os removidos logicamente.
   */
  async findAllWithDeleted(user: any): Promise<any[]> {
    const userId = await this.getUserId(user);
    const propriedadesUsuario = await this.getUserPropriedades(userId);

    const supabase = this.supabaseService.getAdminClient();
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*, raca:id_raca(nome, descricao), grupo:id_grupo(nome_grupo)')
      .in('id_propriedade', propriedadesUsuario)
      .order('deleted_at', { ascending: false, nullsFirst: true })
      .order('dt_nascimento', { ascending: false });

    if (error) {
      throw new InternalServerErrorException('Erro ao buscar búfalos (incluindo deletados).');
    }

    return formatDateFieldsArray(data || []);
  }

  /**
   * Atualiza grupo de múltiplos búfalos.
   */
  async updateGrupo(updateGrupoDto: UpdateGrupoBufaloDto, user: any) {
    const userId = await this.getUserId(user);

    // Valida acesso a todos os búfalos
    for (const id_bufalo of updateGrupoDto.ids_bufalos) {
      await this.validateBufaloAccess(id_bufalo, userId);
    }

    // Atualiza em lote
    const response = await this.bufaloRepo.updateMany(updateGrupoDto.ids_bufalos, { id_grupo: updateGrupoDto.id_novo_grupo });

    if (response.error) {
      throw new InternalServerErrorException(`Falha ao atualizar grupo: ${response.error.message}`);
    }

    this.logger.log(`✅ Grupo atualizado para ${updateGrupoDto.ids_bufalos.length} búfalos`);
    return {
      message: `Grupo atualizado com sucesso para ${updateGrupoDto.ids_bufalos.length} búfalos.`,
      updated: response.data,
      total_processados: updateGrupoDto.ids_bufalos.length,
    };
  }

  // ==================== MÉTODOS ADICIONAIS DE FILTRO (COMPATIBILIDADE) ====================

  /**
   * Busca búfalos por categoria ABCB.
   */
  async findByCategoria(categoria: string, user: any) {
    const userId = await this.getUserId(user);
    const propriedadesUsuario = await this.getUserPropriedades(userId);

    const supabase = this.supabaseService.getAdminClient();
    const { data, error } = await supabase
      .from(this.tableName)
      .select(
        `
        *,
        raca:id_raca(nome),
        grupo:id_grupo(nome_grupo),
        propriedade:id_propriedade(nome)
      `,
      )
      .eq('categoria', categoria)
      .in('id_propriedade', propriedadesUsuario)
      .eq('status', true)
      .order('dt_nascimento', { ascending: true });

    if (error) {
      this.logger.error(`Erro ao buscar búfalos por categoria ${categoria}:`, error);
      throw new InternalServerErrorException(`Falha ao buscar búfalos por categoria: ${error.message}`);
    }

    if (!data || data.length === 0) {
      this.logger.log(`Nenhum búfalo encontrado com categoria ${categoria}`);
      return [];
    }

    this.logger.log(`✅ Encontrados ${data.length} búfalos com categoria ${categoria}`);
    await this.maturidadeService.atualizarMaturidadeSeNecessario(data);
    return formatDateFieldsArray(data);
  }

  /**
   * Busca búfalos por raça e brinco.
   */
  async findByRacaAndBrinco(
    id_raca: string,
    id_propriedade: string,
    brinco: string,
    user: any,
    paginationDto: PaginationDto = {},
  ): Promise<PaginatedResponse<any>> {
    const { page = 1, limit = 10 } = paginationDto;
    const { offset } = calculatePaginationParams(page, limit);

    const userId = await this.getUserId(user);
    await this.validatePropriedadeAccess(id_propriedade, userId);

    const resultado = await this.filtrosService.filtrarBufalos({ id_propriedade, id_raca, brinco, status: true }, { offset, limit });

    await this.maturidadeService.atualizarMaturidadeSeNecessario(resultado.data);

    const formattedData = formatDateFieldsArray(resultado.data);
    return createPaginatedResponse(formattedData, resultado.total, page, limit);
  }

  /**
   * Busca búfalos por sexo e brinco.
   */
  async findBySexoAndBrinco(
    sexo: string,
    id_propriedade: string,
    brinco: string,
    user: any,
    paginationDto: PaginationDto = {},
  ): Promise<PaginatedResponse<any>> {
    const { page = 1, limit = 10 } = paginationDto;
    const { offset } = calculatePaginationParams(page, limit);

    const userId = await this.getUserId(user);
    await this.validatePropriedadeAccess(id_propriedade, userId);

    const resultado = await this.filtrosService.filtrarBufalos({ id_propriedade, sexo: sexo as any, brinco, status: true }, { offset, limit });

    await this.maturidadeService.atualizarMaturidadeSeNecessario(resultado.data);

    const formattedData = formatDateFieldsArray(resultado.data);
    return createPaginatedResponse(formattedData, resultado.total, page, limit);
  }

  /**
   * Busca búfalos por sexo e status.
   */
  async findBySexoAndStatus(
    sexo: string,
    status: boolean,
    id_propriedade: string,
    user: any,
    paginationDto: PaginationDto = {},
  ): Promise<PaginatedResponse<any>> {
    const { page = 1, limit = 10 } = paginationDto;
    const { offset } = calculatePaginationParams(page, limit);

    const userId = await this.getUserId(user);
    await this.validatePropriedadeAccess(id_propriedade, userId);

    const resultado = await this.filtrosService.filtrarBufalos({ id_propriedade, sexo: sexo as any, status }, { offset, limit });

    await this.maturidadeService.atualizarMaturidadeSeNecessario(resultado.data);

    const formattedData = formatDateFieldsArray(resultado.data);
    return createPaginatedResponse(formattedData, resultado.total, page, limit);
  }

  /**
   * Busca búfalos por maturidade e brinco.
   */
  async findByMaturidadeAndBrinco(
    nivel_maturidade: string,
    id_propriedade: string,
    brinco: string,
    user: any,
    paginationDto: PaginationDto = {},
  ): Promise<PaginatedResponse<any>> {
    const { page = 1, limit = 10 } = paginationDto;
    const { offset } = calculatePaginationParams(page, limit);

    const userId = await this.getUserId(user);
    await this.validatePropriedadeAccess(id_propriedade, userId);

    const resultado = await this.filtrosService.filtrarBufalos(
      { id_propriedade, nivel_maturidade: nivel_maturidade as any, brinco, status: true },
      { offset, limit },
    );

    await this.maturidadeService.atualizarMaturidadeSeNecessario(resultado.data);

    const formattedData = formatDateFieldsArray(resultado.data);
    return createPaginatedResponse(formattedData, resultado.total, page, limit);
  }

  /**
   * Busca búfalos por maturidade e status.
   */
  async findByMaturidadeAndStatus(
    nivel_maturidade: string,
    status: boolean,
    id_propriedade: string,
    user: any,
    paginationDto: PaginationDto = {},
  ): Promise<PaginatedResponse<any>> {
    const { page = 1, limit = 10 } = paginationDto;
    const { offset } = calculatePaginationParams(page, limit);

    const userId = await this.getUserId(user);
    await this.validatePropriedadeAccess(id_propriedade, userId);

    const resultado = await this.filtrosService.filtrarBufalos(
      { id_propriedade, nivel_maturidade: nivel_maturidade as any, status },
      { offset, limit },
    );

    await this.maturidadeService.atualizarMaturidadeSeNecessario(resultado.data);

    const formattedData = formatDateFieldsArray(resultado.data);
    return createPaginatedResponse(formattedData, resultado.total, page, limit);
  }

  /**
   * Busca búfalos por raça e status.
   */
  async findByRacaAndStatus(
    id_raca: string,
    status: boolean,
    id_propriedade: string,
    user: any,
    paginationDto: PaginationDto = {},
  ): Promise<PaginatedResponse<any>> {
    const { page = 1, limit = 10 } = paginationDto;
    const { offset } = calculatePaginationParams(page, limit);

    const userId = await this.getUserId(user);
    await this.validatePropriedadeAccess(id_propriedade, userId);

    const resultado = await this.filtrosService.filtrarBufalos({ id_propriedade, id_raca, status }, { offset, limit });

    await this.maturidadeService.atualizarMaturidadeSeNecessario(resultado.data);

    const formattedData = formatDateFieldsArray(resultado.data);
    return createPaginatedResponse(formattedData, resultado.total, page, limit);
  }

  /**
   * Busca búfalos por status.
   */
  async findByStatus(status: boolean, id_propriedade: string, user: any, paginationDto: PaginationDto = {}): Promise<PaginatedResponse<any>> {
    const { page = 1, limit = 10 } = paginationDto;
    const { offset } = calculatePaginationParams(page, limit);

    const userId = await this.getUserId(user);
    await this.validatePropriedadeAccess(id_propriedade, userId);

    const resultado = await this.filtrosService.filtrarBufalos({ id_propriedade, status }, { offset, limit });

    await this.maturidadeService.atualizarMaturidadeSeNecessario(resultado.data);

    const formattedData = formatDateFieldsArray(resultado.data);
    return createPaginatedResponse(formattedData, resultado.total, page, limit);
  }

  /**
   * Busca búfalos por status e brinco.
   */
  async findByStatusAndBrinco(
    status: boolean,
    id_propriedade: string,
    brinco: string,
    user: any,
    paginationDto: PaginationDto = {},
  ): Promise<PaginatedResponse<any>> {
    const { page = 1, limit = 10 } = paginationDto;
    const { offset } = calculatePaginationParams(page, limit);

    const userId = await this.getUserId(user);
    await this.validatePropriedadeAccess(id_propriedade, userId);

    const resultado = await this.filtrosService.filtrarBufalos({ id_propriedade, status, brinco }, { offset, limit });

    await this.maturidadeService.atualizarMaturidadeSeNecessario(resultado.data);

    const formattedData = formatDateFieldsArray(resultado.data);
    return createPaginatedResponse(formattedData, resultado.total, page, limit);
  }

  // ==================== PROCESSAMENTO DE CATEGORIA ABCB ====================

  /**
   * Processa categoria ABCB de um búfalo específico.
   */
  async processarCategoriaABCB(id_bufalo: string) {
    const supabase = this.supabaseService.getAdminClient();

    // Busca dados do búfalo
    const { data: bufalo, error } = await supabase
      .from(this.tableName)
      .select('*, propriedade:id_propriedade(participa_abcb)')
      .eq('id_bufalo', id_bufalo)
      .single();

    if (error || !bufalo) {
      throw new NotFoundException(`Búfalo ${id_bufalo} não encontrado.`);
    }

    // Constrói árvore genealógica
    const arvoreGenealogica = await this.genealogiaService.construirArvoreParaCategoria(id_bufalo, 4);

    if (!arvoreGenealogica) {
      throw new BadRequestException('Não foi possível construir a árvore genealógica.');
    }

    // Calcula categoria
    const categoria = this.categoriaService.processarCategoriaABCB(arvoreGenealogica, bufalo.propriedade?.participa_abcb || false);

    // Atualiza no banco
    await this.bufaloRepo.update(id_bufalo, { categoria });

    return {
      id_bufalo,
      categoria_antiga: bufalo.categoria,
      categoria_nova: categoria,
      atualizado: true,
    };
  }

  /**
   * Processa categoria ABCB de todos os búfalos de uma propriedade.
   */
  async processarCategoriaPropriedade(id_propriedade: string, user: any) {
    const userId = await this.getUserId(user);
    await this.validatePropriedadeAccess(id_propriedade, userId);

    const supabase = this.supabaseService.getAdminClient();

    // Busca todos os búfalos ativos da propriedade
    const { data: bufalos, error } = await supabase
      .from(this.tableName)
      .select('id_bufalo, nome, brinco, categoria')
      .eq('id_propriedade', id_propriedade)
      .eq('status', true);

    if (error) {
      throw new InternalServerErrorException('Falha ao buscar búfalos da propriedade.');
    }

    const resultados: any[] = [];
    let atualizados = 0;
    let erros = 0;

    for (const bufalo of bufalos || []) {
      try {
        const resultado = await this.processarCategoriaABCB(bufalo.id_bufalo);
        resultados.push(resultado);

        if (resultado.categoria_antiga !== resultado.categoria_nova) {
          atualizados++;
        }
      } catch (error) {
        erros++;
        this.logger.error(`Erro ao processar categoria do búfalo ${bufalo.id_bufalo}:`, error);
      }
    }

    return {
      total_processados: bufalos?.length || 0,
      atualizados,
      erros,
      resultados,
      total: bufalos?.length || 0,
      sucesso: atualizados,
    };
  }
}
