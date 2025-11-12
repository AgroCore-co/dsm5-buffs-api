import { Injectable, NotFoundException, InternalServerErrorException, BadRequestException, Logger } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from '../../../core/supabase/supabase.service';
import { CreateBufaloDto } from './dto/create-bufalo.dto';
import { UpdateBufaloDto } from './dto/update-bufalo.dto';
import { UpdateGrupoBufaloDto } from './dto/update-grupo-bufalo.dto';
import { FiltroBufaloDto } from './dto/filtro-bufalo.dto';
import { BufaloMaturityUtils } from './utils/maturity.utils';
import { BufaloAgeUtils } from './utils/age.utils';
import { BufaloValidationUtils } from './utils/validation.utils';
import { NivelMaturidade } from './dto/create-bufalo.dto';
import { CategoriaABCBUtil } from './utils/categoria-abcb.util';
import { CategoriaABCB } from './dto/categoria-abcb.dto';
import { GenealogiaService } from '../../reproducao/genealogia/genealogia.service';
import { PaginationDto, PaginatedResponse } from '../../../core/dto/pagination.dto';
import { createPaginatedResponse, calculatePaginationParams } from '../../../core/utils/pagination.utils';
import { formatDateFields, formatDateFieldsArray } from '../../../core/utils/date-formatter.utils';

// Interface para tipar as atualizações de maturidade
interface MaturityUpdate {
  id_bufalo: string;
  nivel_maturidade: NivelMaturidade;
  status: boolean;
}

@Injectable()
export class BufaloService {
  private readonly logger = new Logger(BufaloService.name);
  private supabase: SupabaseClient;
  private readonly tableName = 'bufalo';

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly genealogiaService: GenealogiaService,
  ) {
    this.supabase = this.supabaseService.getAdminClient();
  }

  private async getUserId(user: any): Promise<number> {
    const { data: perfilUsuario, error } = await this.supabase.from('usuario').select('id_usuario').eq('email', user.email).single();

    if (error || !perfilUsuario) {
      throw new NotFoundException('Perfil de usuário não encontrado.');
    }
    return perfilUsuario.id_usuario;
  }

  /**
   * Busca todas as propriedades vinculadas ao usuário (como dono OU funcionário)
   */
  private async getUserPropriedades(userId: number): Promise<string[]> {
    // 1. Busca propriedades onde o usuário é DONO
    const { data: propriedadesComoDono, error: errorDono } = await this.supabase.from('propriedade').select('id_propriedade').eq('id_dono', userId);

    // 2. Busca propriedades onde o usuário é FUNCIONÁRIO
    const { data: propriedadesComoFuncionario, error: errorFuncionario } = await this.supabase
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
    const propriedadesUnicas = Array.from(new Set(todasPropriedades.map((p) => p.id_propriedade))).map((id) => ({ id_propriedade: id }));

    if (propriedadesUnicas.length === 0) {
      throw new NotFoundException('Usuário não está associado a nenhuma propriedade.');
    }

    return propriedadesUnicas.map((item) => item.id_propriedade);
  }

  /**
   * Valida se o usuário tem acesso ao búfalo através das propriedades vinculadas
   */
  private async validateBufaloAccess(bufaloId: string, userId: number): Promise<void> {
    // Busca as propriedades do usuário
    const propriedadesUsuario = await this.getUserPropriedades(userId);

    // Verifica se o búfalo pertence a alguma das propriedades do usuário
    const { data: bufalo, error: bufaloError } = await this.supabase
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
   * Valida se a propriedade no DTO está vinculada ao usuário e outras referências
   */
  private async validateReferencesAndOwnership(dto: CreateBufaloDto | UpdateBufaloDto, userId: number): Promise<void> {
    // Busca as propriedades associadas ao usuário
    const propriedadesUsuario = await this.getUserPropriedades(userId);

    // Valida se a propriedade no DTO está vinculada ao usuário
    if (dto.id_propriedade && !propriedadesUsuario.includes(dto.id_propriedade)) {
      throw new BadRequestException('Você só pode criar/atualizar búfalos em propriedades às quais está vinculado.');
    }

    // Se não foi fornecido id_propriedade, é obrigatório para criação
    if (!dto.id_propriedade && dto.constructor.name === 'CreateBufaloDto') {
      throw new BadRequestException('ID da propriedade é obrigatório para criar um búfalo.');
    }

    // Validação de outras referências
    const checkIfExists = async (tableName: string, columnName: string, id: string) => {
      const { data, error } = await this.supabase.from(tableName).select(columnName).eq(columnName, id).single();
      if (error || !data) {
        throw new NotFoundException(`${tableName} com ID ${id} não encontrado.`);
      }
    };

    if (dto.id_raca) await checkIfExists('raca', 'id_raca', dto.id_raca);
    if (dto.id_grupo) await checkIfExists('grupo', 'id_grupo', dto.id_grupo);
    if (dto.id_pai) await checkIfExists('bufalo', 'id_bufalo', dto.id_pai);
    if (dto.id_mae) await checkIfExists('bufalo', 'id_bufalo', dto.id_mae);
  }

  async create(createDto: CreateBufaloDto, user: any) {
    console.log('BufaloService.create - Iniciando criação de búfalo:', createDto);
    console.log('BufaloService.create - User:', user);

    const userId = await this.getUserId(user);
    console.log('BufaloService.create - UserId obtido:', userId);

    await this.validateReferencesAndOwnership(createDto, userId);
    console.log('BufaloService.create - Validações passaram');

    // Processa dados com lógica de maturidade
    const processedDto = await this.processMaturityData(createDto);
    console.log('BufaloService.create - Dados processados:', processedDto);

    console.log('BufaloService.create - Inserindo no banco de dados...');
    console.log('BufaloService.create - DTO para inserção:', JSON.stringify(processedDto, null, 2));

    // Remove qualquer id_bufalo que possa estar sendo enviado (UUID é auto-gerado pelo banco)
    const { id_bufalo, ...insertDto } = processedDto;
    console.log('BufaloService.create - DTO final (sem id_bufalo):', JSON.stringify(insertDto, null, 2));

    // Insere o búfalo (id_bufalo será auto-gerado como UUID pelo banco)
    const { data, error } = await this.supabase.from(this.tableName).insert(insertDto).select().single();

    if (error) {
      console.error('BufaloService.create - Erro ao inserir:', error);
      if (error.code === '23503') {
        // Erro de chave estrangeira
        throw new BadRequestException('Falha ao criar búfalo: uma das referências (raça, grupo, etc.) é inválida.');
      }
      throw new InternalServerErrorException(`Falha ao criar o búfalo: ${error.message}`);
    }

    console.log('BufaloService.create - Búfalo criado com sucesso:', data);

    // Processa categoria ABCB em background (não bloqueia a resposta)
    if (data?.id_bufalo) {
      setImmediate(async () => {
        try {
          this.logger.log(`Iniciando processamento de categoria ABCB em background para búfalo ${data.id_bufalo}`);
          await this.processarCategoriaABCB(data.id_bufalo);
          this.logger.log(`Categoria ABCB processada com sucesso para búfalo ${data.id_bufalo}`);
        } catch (error) {
          // Não propaga o erro para não afetar a criação principal
          this.logger.error(`Erro ao processar categoria ABCB em background para búfalo ${data.id_bufalo}:`, error);
          console.error('Stack trace completo:', error);
        }
      });
    }

    return formatDateFields(data);
  }

  async findAll(user: any, paginationDto: PaginationDto = {}): Promise<PaginatedResponse<any>> {
    const { page = 1, limit = 10 } = paginationDto;
    const { offset } = calculatePaginationParams(page, limit);

    const userId = await this.getUserId(user);

    // Busca as propriedades do usuário
    const propriedadesUsuario = await this.getUserPropriedades(userId);

    // Primeiro, busca o total de registros
    const { count, error: countError } = await this.supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
      .in('id_propriedade', propriedadesUsuario);

    if (countError) {
      throw new InternalServerErrorException('Falha ao contar os búfalos.');
    }

    // Busca búfalos com paginação e ordenação conforme especificado
    // Prioriza status = true, depois ordena por data de nascimento (mais antigos primeiro)
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(
        `
        *,
        raca:id_raca(nome),
        grupo:id_grupo(nome_grupo),
        propriedade:id_propriedade(nome)
      `,
      )
      .in('id_propriedade', propriedadesUsuario)
      .order('status', { ascending: false }) // true primeiro
      .order('dt_nascimento', { ascending: true }) // mais antigos primeiro
      .range(offset, offset + limit - 1);

    if (error) {
      throw new InternalServerErrorException('Falha ao buscar os búfalos.');
    }

    // Atualiza maturidade automaticamente para búfalos com status = true
    const bufalosAtivos = (data || []).filter((bufalo) => bufalo.status === true);
    await this.updateMaturityIfNeeded(bufalosAtivos);

    const formattedData = formatDateFieldsArray(data || []);
    return createPaginatedResponse(formattedData, count || 0, page, limit);
  }

  async findOne(id: string, user: any) {
    const userId = await this.getUserId(user);

    // Valida acesso antes de buscar os dados completos
    await this.validateBufaloAccess(id, userId);

    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(
        `
        *,
        raca:id_raca(nome),
        grupo:id_grupo(nome_grupo),
        propriedade:id_propriedade(nome)
      `,
      )
      .eq('id_bufalo', id)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Búfalo com ID ${id} não encontrado.`);
    }

    // Atualiza maturidade automaticamente se necessário
    await this.updateMaturityIfNeeded([data]);

    return data;
  }

  async findByPropriedade(id_propriedade: string, user: any, paginationDto: PaginationDto = {}): Promise<PaginatedResponse<any>> {
    const { page = 1, limit = 10 } = paginationDto;
    const { offset } = calculatePaginationParams(page, limit);

    const userId = await this.getUserId(user);

    // Valida se o usuário tem acesso à propriedade
    const propriedadesUsuario = await this.getUserPropriedades(userId);

    if (!propriedadesUsuario.includes(id_propriedade)) {
      throw new NotFoundException(`Propriedade com ID ${id_propriedade} não encontrada ou você não tem acesso a ela.`);
    }

    // Busca total de búfalos na propriedade
    const { count, error: countError } = await this.supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
      .eq('id_propriedade', id_propriedade);

    if (countError) {
      throw new InternalServerErrorException('Falha ao contar os búfalos da propriedade.');
    }

    // Busca búfalos da propriedade com paginação
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(
        `
        *,
        raca:id_raca(nome),
        grupo:id_grupo(nome_grupo),
        propriedade:id_propriedade(nome)
      `,
      )
      .eq('id_propriedade', id_propriedade)
      .order('status', { ascending: false })
      .order('dt_nascimento', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new InternalServerErrorException('Falha ao buscar os búfalos da propriedade.');
    }

    // Atualiza maturidade automaticamente para búfalos ativos
    const bufalosAtivos = (data || []).filter((bufalo) => bufalo.status === true);
    await this.updateMaturityIfNeeded(bufalosAtivos);

    const formattedData = formatDateFieldsArray(data || []);
    return createPaginatedResponse(formattedData, count || 0, page, limit);
  }

  /**
   * Filtra búfalos por raça em uma propriedade específica
   * Ordenação: status DESC, dt_nascimento ASC (mesma do findAll)
   */
  async findByRaca(id_raca: string, id_propriedade: string, user: any, paginationDto: PaginationDto = {}): Promise<PaginatedResponse<any>> {
    const { page = 1, limit = 10 } = paginationDto;
    const { offset } = calculatePaginationParams(page, limit);

    const userId = await this.getUserId(user);
    const propriedadesUsuario = await this.getUserPropriedades(userId);

    if (!propriedadesUsuario.includes(id_propriedade)) {
      throw new NotFoundException(`Propriedade com ID ${id_propriedade} não encontrada ou você não tem acesso a ela.`);
    }

    // Busca total
    const { count, error: countError } = await this.supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
      .eq('id_propriedade', id_propriedade)
      .eq('id_raca', id_raca);

    if (countError) {
      throw new InternalServerErrorException('Falha ao contar os búfalos filtrados por raça.');
    }

    // Busca com paginação e ordenação padrão
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(
        `
        *,
        raca:id_raca(nome),
        grupo:id_grupo(nome_grupo),
        propriedade:id_propriedade(nome)
      `,
      )
      .eq('id_propriedade', id_propriedade)
      .eq('id_raca', id_raca)
      .order('status', { ascending: false })
      .order('dt_nascimento', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new InternalServerErrorException('Falha ao buscar búfalos filtrados por raça.');
    }

    // Atualiza maturidade de búfalos ativos
    const bufalosAtivos = (data || []).filter((bufalo) => bufalo.status === true);
    await this.updateMaturityIfNeeded(bufalosAtivos);

    const formattedData = formatDateFieldsArray(data || []);
    return createPaginatedResponse(formattedData, count || 0, page, limit);
  }

  /**
   * Filtra búfalos por raça e brinco (busca progressiva com ILIKE)
   * Permite busca progressiva: "IZ" → "IZ-0" → "IZ-001"
   * Ordenação: status DESC, dt_nascimento ASC (mesma do findAll)
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
    const propriedadesUsuario = await this.getUserPropriedades(userId);

    if (!propriedadesUsuario.includes(id_propriedade)) {
      throw new NotFoundException(`Propriedade com ID ${id_propriedade} não encontrada ou você não tem acesso a ela.`);
    }

    // Busca total com filtros
    const { count, error: countError } = await this.supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
      .eq('id_propriedade', id_propriedade)
      .eq('id_raca', id_raca)
      .ilike('brinco', `${brinco}%`);

    if (countError) {
      throw new InternalServerErrorException('Falha ao contar búfalos filtrados por raça e brinco.');
    }

    // Busca com paginação e ordenação padrão
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(
        `
        *,
        raca:id_raca(nome),
        grupo:id_grupo(nome_grupo),
        propriedade:id_propriedade(nome)
      `,
      )
      .eq('id_propriedade', id_propriedade)
      .eq('id_raca', id_raca)
      .ilike('brinco', `${brinco}%`)
      .order('status', { ascending: false })
      .order('dt_nascimento', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new InternalServerErrorException('Falha ao buscar búfalos filtrados por raça e brinco.');
    }

    // Atualiza maturidade de búfalos ativos
    const bufalosAtivos = (data || []).filter((bufalo) => bufalo.status === true);
    await this.updateMaturityIfNeeded(bufalosAtivos);

    const formattedData = formatDateFieldsArray(data || []);
    return createPaginatedResponse(formattedData, count || 0, page, limit);
  }

  /**
   * Filtragem avançada por múltiplos critérios
   * Suporta: raça, sexo, maturidade, status e brinco
   * Ordenação: status DESC, dt_nascimento ASC (mesma do findAll)
   */
  async findByFiltros(
    id_propriedade: string,
    filtros: FiltroBufaloDto,
    user: any,
    paginationDto: PaginationDto = {},
  ): Promise<PaginatedResponse<any>> {
    const { page = 1, limit = 10 } = paginationDto;
    const { offset } = calculatePaginationParams(page, limit);

    const userId = await this.getUserId(user);
    const propriedadesUsuario = await this.getUserPropriedades(userId);

    if (!propriedadesUsuario.includes(id_propriedade)) {
      throw new NotFoundException(`Propriedade com ID ${id_propriedade} não encontrada ou você não tem acesso a ela.`);
    }

    // Query base para contagem
    let queryCount = this.supabase.from(this.tableName).select('*', { count: 'exact', head: true }).eq('id_propriedade', id_propriedade);

    // Query base para dados
    let queryData = this.supabase
      .from(this.tableName)
      .select(
        `
        *,
        raca:id_raca(nome),
        grupo:id_grupo(nome_grupo),
        propriedade:id_propriedade(nome)
      `,
      )
      .eq('id_propriedade', id_propriedade);

    // Aplica filtros dinamicamente
    if (filtros.id_raca) {
      queryCount = queryCount.eq('id_raca', filtros.id_raca);
      queryData = queryData.eq('id_raca', filtros.id_raca);
    }

    if (filtros.sexo) {
      queryCount = queryCount.eq('sexo', filtros.sexo);
      queryData = queryData.eq('sexo', filtros.sexo);
    }

    if (filtros.nivel_maturidade) {
      queryCount = queryCount.eq('nivel_maturidade', filtros.nivel_maturidade);
      queryData = queryData.eq('nivel_maturidade', filtros.nivel_maturidade);
    }

    if (filtros.status !== undefined && filtros.status !== null) {
      queryCount = queryCount.eq('status', filtros.status);
      queryData = queryData.eq('status', filtros.status);
    }

    if (filtros.brinco) {
      queryCount = queryCount.ilike('brinco', `${filtros.brinco}%`);
      queryData = queryData.ilike('brinco', `${filtros.brinco}%`);
    }

    // Executa contagem
    const { count, error: countError } = await queryCount;

    if (countError) {
      throw new InternalServerErrorException('Falha ao contar búfalos com filtros avançados.');
    }

    // Executa busca com ordenação padrão e paginação
    // Se status está sendo filtrado, não ordena por status (já está filtrado)
    // Senão, prioriza ativos (status DESC) e depois ordena por data de nascimento
    if (filtros.status !== undefined && filtros.status !== null) {
      queryData = queryData.order('dt_nascimento', { ascending: true });
    } else {
      queryData = queryData.order('status', { ascending: false }).order('dt_nascimento', { ascending: true });
    }

    const { data, error } = await queryData.range(offset, offset + limit - 1);

    if (error) {
      throw new InternalServerErrorException('Falha ao buscar búfalos com filtros avançados.');
    }

    // Atualiza maturidade de búfalos ativos
    const bufalosAtivos = (data || []).filter((bufalo) => bufalo.status === true);
    await this.updateMaturityIfNeeded(bufalosAtivos);

    const formattedData = formatDateFieldsArray(data || []);

    return createPaginatedResponse(formattedData, count || 0, page, limit);
  }

  /**
   * Filtra búfalos por sexo em uma propriedade
   */
  async findBySexo(sexo: string, id_propriedade: string, user: any, paginationDto: PaginationDto = {}): Promise<PaginatedResponse<any>> {
    const { page = 1, limit = 10 } = paginationDto;
    const { offset } = calculatePaginationParams(page, limit);

    const userId = await this.getUserId(user);
    const propriedadesUsuario = await this.getUserPropriedades(userId);

    if (!propriedadesUsuario.includes(id_propriedade)) {
      throw new NotFoundException(`Propriedade com ID ${id_propriedade} não encontrada ou você não tem acesso a ela.`);
    }

    const { count, error: countError } = await this.supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
      .eq('id_propriedade', id_propriedade)
      .eq('sexo', sexo);

    if (countError) {
      throw new InternalServerErrorException('Falha ao contar búfalos filtrados por sexo.');
    }

    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(
        `
        *,
        raca:id_raca(nome),
        grupo:id_grupo(nome_grupo),
        propriedade:id_propriedade(nome)
      `,
      )
      .eq('id_propriedade', id_propriedade)
      .eq('sexo', sexo)
      .order('status', { ascending: false })
      .order('dt_nascimento', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new InternalServerErrorException('Falha ao buscar búfalos filtrados por sexo.');
    }

    const bufalosAtivos = (data || []).filter((bufalo) => bufalo.status === true);
    await this.updateMaturityIfNeeded(bufalosAtivos);

    const formattedData = formatDateFieldsArray(data || []);
    return createPaginatedResponse(formattedData, count || 0, page, limit);
  }

  /**
   * Filtra búfalos por sexo e brinco
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
    const propriedadesUsuario = await this.getUserPropriedades(userId);

    if (!propriedadesUsuario.includes(id_propriedade)) {
      throw new NotFoundException(`Propriedade com ID ${id_propriedade} não encontrada ou você não tem acesso a ela.`);
    }

    const { count, error: countError } = await this.supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
      .eq('id_propriedade', id_propriedade)
      .eq('sexo', sexo)
      .ilike('brinco', `${brinco}%`);

    if (countError) {
      throw new InternalServerErrorException('Falha ao contar búfalos filtrados por sexo e brinco.');
    }

    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(
        `
        *,
        raca:id_raca(nome),
        grupo:id_grupo(nome_grupo),
        propriedade:id_propriedade(nome)
      `,
      )
      .eq('id_propriedade', id_propriedade)
      .eq('sexo', sexo)
      .ilike('brinco', `${brinco}%`)
      .order('status', { ascending: false })
      .order('dt_nascimento', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new InternalServerErrorException('Falha ao buscar búfalos filtrados por sexo e brinco.');
    }

    const bufalosAtivos = (data || []).filter((bufalo) => bufalo.status === true);
    await this.updateMaturityIfNeeded(bufalosAtivos);

    const formattedData = formatDateFieldsArray(data || []);
    return createPaginatedResponse(formattedData, count || 0, page, limit);
  }

  /**
   * Filtra búfalos por sexo e status
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
    const propriedadesUsuario = await this.getUserPropriedades(userId);

    if (!propriedadesUsuario.includes(id_propriedade)) {
      throw new NotFoundException(`Propriedade com ID ${id_propriedade} não encontrada ou você não tem acesso a ela.`);
    }

    const { count, error: countError } = await this.supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
      .eq('id_propriedade', id_propriedade)
      .eq('sexo', sexo)
      .eq('status', status);

    if (countError) {
      throw new InternalServerErrorException('Falha ao contar búfalos filtrados por sexo e status.');
    }

    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(
        `
        *,
        raca:id_raca(nome),
        grupo:id_grupo(nome_grupo),
        propriedade:id_propriedade(nome)
      `,
      )
      .eq('id_propriedade', id_propriedade)
      .eq('sexo', sexo)
      .eq('status', status)
      .order('status', { ascending: false })
      .order('dt_nascimento', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new InternalServerErrorException('Falha ao buscar búfalos filtrados por sexo e status.');
    }

    const bufalosAtivos = (data || []).filter((bufalo) => bufalo.status === true);
    await this.updateMaturityIfNeeded(bufalosAtivos);

    const formattedData = formatDateFieldsArray(data || []);
    return createPaginatedResponse(formattedData, count || 0, page, limit);
  }

  /**
   * Filtra búfalos por maturidade em uma propriedade
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
    const propriedadesUsuario = await this.getUserPropriedades(userId);

    if (!propriedadesUsuario.includes(id_propriedade)) {
      throw new NotFoundException(`Propriedade com ID ${id_propriedade} não encontrada ou você não tem acesso a ela.`);
    }

    const { count, error: countError } = await this.supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
      .eq('id_propriedade', id_propriedade)
      .eq('nivel_maturidade', nivel_maturidade);

    if (countError) {
      throw new InternalServerErrorException('Falha ao contar búfalos filtrados por maturidade.');
    }

    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(
        `
        *,
        raca:id_raca(nome),
        grupo:id_grupo(nome_grupo),
        propriedade:id_propriedade(nome)
      `,
      )
      .eq('id_propriedade', id_propriedade)
      .eq('nivel_maturidade', nivel_maturidade)
      .order('status', { ascending: false })
      .order('dt_nascimento', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new InternalServerErrorException('Falha ao buscar búfalos filtrados por maturidade.');
    }

    const bufalosAtivos = (data || []).filter((bufalo) => bufalo.status === true);
    await this.updateMaturityIfNeeded(bufalosAtivos);

    const formattedData = formatDateFieldsArray(data || []);
    return createPaginatedResponse(formattedData, count || 0, page, limit);
  }

  /**
   * Filtra búfalos por maturidade e brinco
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
    const propriedadesUsuario = await this.getUserPropriedades(userId);

    if (!propriedadesUsuario.includes(id_propriedade)) {
      throw new NotFoundException(`Propriedade com ID ${id_propriedade} não encontrada ou você não tem acesso a ela.`);
    }

    const { count, error: countError } = await this.supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
      .eq('id_propriedade', id_propriedade)
      .eq('nivel_maturidade', nivel_maturidade)
      .ilike('brinco', `${brinco}%`);

    if (countError) {
      throw new InternalServerErrorException('Falha ao contar búfalos filtrados por maturidade e brinco.');
    }

    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(
        `
        *,
        raca:id_raca(nome),
        grupo:id_grupo(nome_grupo),
        propriedade:id_propriedade(nome)
      `,
      )
      .eq('id_propriedade', id_propriedade)
      .eq('nivel_maturidade', nivel_maturidade)
      .ilike('brinco', `${brinco}%`)
      .order('status', { ascending: false })
      .order('dt_nascimento', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new InternalServerErrorException('Falha ao buscar búfalos filtrados por maturidade e brinco.');
    }

    const bufalosAtivos = (data || []).filter((bufalo) => bufalo.status === true);
    await this.updateMaturityIfNeeded(bufalosAtivos);

    const formattedData = formatDateFieldsArray(data || []);
    return createPaginatedResponse(formattedData, count || 0, page, limit);
  }

  /**
   * Filtra búfalos por maturidade e status
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
    const propriedadesUsuario = await this.getUserPropriedades(userId);

    if (!propriedadesUsuario.includes(id_propriedade)) {
      throw new NotFoundException(`Propriedade com ID ${id_propriedade} não encontrada ou você não tem acesso a ela.`);
    }

    const { count, error: countError } = await this.supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
      .eq('id_propriedade', id_propriedade)
      .eq('nivel_maturidade', nivel_maturidade)
      .eq('status', status);

    if (countError) {
      throw new InternalServerErrorException('Falha ao contar búfalos filtrados por maturidade e status.');
    }

    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(
        `
        *,
        raca:id_raca(nome),
        grupo:id_grupo(nome_grupo),
        propriedade:id_propriedade(nome)
      `,
      )
      .eq('id_propriedade', id_propriedade)
      .eq('nivel_maturidade', nivel_maturidade)
      .eq('status', status)
      .order('status', { ascending: false })
      .order('dt_nascimento', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new InternalServerErrorException('Falha ao buscar búfalos filtrados por maturidade e status.');
    }

    const bufalosAtivos = (data || []).filter((bufalo) => bufalo.status === true);
    await this.updateMaturityIfNeeded(bufalosAtivos);

    const formattedData = formatDateFieldsArray(data || []);
    return createPaginatedResponse(formattedData, count || 0, page, limit);
  }

  /**
   * Filtra búfalos por raça e status
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
    const propriedadesUsuario = await this.getUserPropriedades(userId);

    if (!propriedadesUsuario.includes(id_propriedade)) {
      throw new NotFoundException(`Propriedade com ID ${id_propriedade} não encontrada ou você não tem acesso a ela.`);
    }

    const { count, error: countError } = await this.supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
      .eq('id_propriedade', id_propriedade)
      .eq('id_raca', id_raca)
      .eq('status', status);

    if (countError) {
      throw new InternalServerErrorException('Falha ao contar búfalos filtrados por raça e status.');
    }

    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(
        `
        *,
        raca:id_raca(nome),
        grupo:id_grupo(nome_grupo),
        propriedade:id_propriedade(nome)
      `,
      )
      .eq('id_propriedade', id_propriedade)
      .eq('id_raca', id_raca)
      .eq('status', status)
      .order('status', { ascending: false })
      .order('dt_nascimento', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new InternalServerErrorException('Falha ao buscar búfalos filtrados por raça e status.');
    }

    const bufalosAtivos = (data || []).filter((bufalo) => bufalo.status === true);
    await this.updateMaturityIfNeeded(bufalosAtivos);

    const formattedData = formatDateFieldsArray(data || []);
    return createPaginatedResponse(formattedData, count || 0, page, limit);
  }

  /**
   * Filtra búfalos por status apenas (sem preferência de status na ordenação)
   */
  async findByStatus(status: boolean, id_propriedade: string, user: any, paginationDto: PaginationDto = {}): Promise<PaginatedResponse<any>> {
    const { page = 1, limit = 10 } = paginationDto;
    const { offset } = calculatePaginationParams(page, limit);

    const userId = await this.getUserId(user);
    const propriedadesUsuario = await this.getUserPropriedades(userId);

    if (!propriedadesUsuario.includes(id_propriedade)) {
      throw new NotFoundException(`Propriedade com ID ${id_propriedade} não encontrada ou você não tem acesso a ela.`);
    }

    const { count, error: countError } = await this.supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
      .eq('id_propriedade', id_propriedade)
      .eq('status', status);

    if (countError) {
      throw new InternalServerErrorException('Falha ao contar búfalos filtrados por status.');
    }

    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(
        `
        *,
        raca:id_raca(nome),
        grupo:id_grupo(nome_grupo),
        propriedade:id_propriedade(nome)
      `,
      )
      .eq('id_propriedade', id_propriedade)
      .eq('status', status)
      .order('dt_nascimento', { ascending: true }) // Apenas por data, sem priorizar status
      .range(offset, offset + limit - 1);

    if (error) {
      throw new InternalServerErrorException('Falha ao buscar búfalos filtrados por status.');
    }

    const bufalosAtivos = (data || []).filter((bufalo) => bufalo.status === true);
    await this.updateMaturityIfNeeded(bufalosAtivos);

    const formattedData = formatDateFieldsArray(data || []);
    return createPaginatedResponse(formattedData, count || 0, page, limit);
  }

  /**
   * Filtra búfalos por status e brinco (sem preferência de status na ordenação)
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
    const propriedadesUsuario = await this.getUserPropriedades(userId);

    if (!propriedadesUsuario.includes(id_propriedade)) {
      throw new NotFoundException(`Propriedade com ID ${id_propriedade} não encontrada ou você não tem acesso a ela.`);
    }

    const { count, error: countError } = await this.supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
      .eq('id_propriedade', id_propriedade)
      .eq('status', status)
      .ilike('brinco', `${brinco}%`);

    if (countError) {
      throw new InternalServerErrorException('Falha ao contar búfalos filtrados por status e brinco.');
    }

    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(
        `
        *,
        raca:id_raca(nome),
        grupo:id_grupo(nome_grupo),
        propriedade:id_propriedade(nome)
      `,
      )
      .eq('id_propriedade', id_propriedade)
      .eq('status', status)
      .ilike('brinco', `${brinco}%`)
      .order('dt_nascimento', { ascending: true }) // Apenas por data, sem priorizar status
      .range(offset, offset + limit - 1);

    if (error) {
      throw new InternalServerErrorException('Falha ao buscar búfalos filtrados por status e brinco.');
    }

    const bufalosAtivos = (data || []).filter((bufalo) => bufalo.status === true);
    await this.updateMaturityIfNeeded(bufalosAtivos);

    const formattedData = formatDateFieldsArray(data || []);
    return createPaginatedResponse(formattedData, count || 0, page, limit);
  }

  async findByMicrochip(microchip: string, user: any) {
    const userId = await this.getUserId(user);

    // Busca as propriedades do usuário
    const propriedadesUsuario = await this.getUserPropriedades(userId);

    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(
        `
        *,
        raca:id_raca(nome),
        grupo:id_grupo(nome_grupo),
        propriedade:id_propriedade(nome)
      `,
      )
      .eq('microchip', microchip)
      .in('id_propriedade', propriedadesUsuario)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Búfalo com microchip ${microchip} não encontrado ou você não tem acesso a ele.`);
    }

    // Atualiza maturidade automaticamente se necessário
    await this.updateMaturityIfNeeded([data]);

    return formatDateFields(data);
  }

  async update(id: string, updateDto: UpdateBufaloDto, user: any) {
    const userId = await this.getUserId(user);

    // Valida acesso ao búfalo
    await this.validateBufaloAccess(id, userId);

    // Busca dados existentes para processamento
    const { data: existingBufalo, error: fetchError } = await this.supabase.from(this.tableName).select('*').eq('id_bufalo', id).single();

    if (fetchError || !existingBufalo) {
      throw new NotFoundException(`Búfalo com ID ${id} não encontrado.`);
    }

    await this.validateReferencesAndOwnership(updateDto, userId);

    // Processa dados com lógica de maturidade
    const processedDto = await this.processMaturityData(updateDto, existingBufalo);

    const { data, error } = await this.supabase.from(this.tableName).update(processedDto).eq('id_bufalo', id).select().single();

    if (error) {
      throw new InternalServerErrorException(`Falha ao atualizar o búfalo: ${error.message}`);
    }

    // Processa categoria ABCB em background (não bloqueia a resposta)
    // Usa setImmediate ao invés de setTimeout para melhor performance
    setImmediate(async () => {
      try {
        this.logger.log(`Iniciando processamento de categoria ABCB em background para búfalo ${id}`);
        await this.processarCategoriaABCB(id);
        this.logger.log(`Categoria ABCB processada com sucesso para búfalo ${id}`);
      } catch (error) {
        // Não propaga o erro para não afetar a atualização principal
        this.logger.error(`Erro ao processar categoria ABCB em background para búfalo ${id}:`, error);
        console.error('Stack trace completo:', error);
      }
    });

    return formatDateFields(data);
  }

  /**
   * Muda o grupo de manejo de um ou mais búfalos
   * Esta operação é usada para mudanças de status (ex: Lactando -> Secagem)
   */
  async updateGrupo(dto: UpdateGrupoBufaloDto, user: any) {
    const { ids_bufalos, id_novo_grupo, motivo } = dto;
    const userId = await this.getUserId(user);

    // Log inicial da operação
    this.logger.log(`[INICIO] Mudança de grupo iniciada - Usuario: ${userId}, Bufalos: [${ids_bufalos.join(', ')}], Novo Grupo: ${id_novo_grupo}`);

    try {
      // Validação de duplicatas
      const uniqueIds = [...new Set(ids_bufalos)];
      if (uniqueIds.length !== ids_bufalos.length) {
        this.logger.warn(`[VALIDACAO] IDs duplicados detectados - Original: [${ids_bufalos.join(', ')}], Unicos: [${uniqueIds.join(', ')}]`);
        throw new BadRequestException('IDs de búfalos duplicados encontrados na lista.');
      }

      // Log de validação de acesso
      this.logger.debug(`[VALIDACAO] Verificando acesso do usuario ${userId} aos ${uniqueIds.length} bufalos`);

      // Validação: Garante que o usuário tem acesso a TODOS os búfalos
      const validacaoPromises = uniqueIds.map(async (bufaloId) => {
        try {
          await this.validateBufaloAccess(bufaloId, userId);
          this.logger.debug(`[ACESSO_OK] Usuario ${userId} tem acesso ao bufalo ${bufaloId}`);
          return { bufaloId, acesso: true };
        } catch (error) {
          this.logger.error(`[ACESSO_NEGADO] Usuario ${userId} sem acesso ao bufalo ${bufaloId}: ${error.message}`);
          return { bufaloId, acesso: false, erro: error.message };
        }
      });

      const resultadosValidacao = await Promise.all(validacaoPromises);
      const semAcesso = resultadosValidacao.filter((r) => !r.acesso);

      if (semAcesso.length > 0) {
        this.logger.error(`[ERRO_ACESSO] ${semAcesso.length} bufalos sem acesso: [${semAcesso.map((s) => s.bufaloId).join(', ')}]`);
        throw new BadRequestException(`Você não tem acesso aos búfalos: ${semAcesso.map((s) => s.bufaloId).join(', ')}`);
      }

      // Log de validação do grupo
      this.logger.debug(`[VALIDACAO] Verificando existencia do grupo ${id_novo_grupo}`);

      // Validação: Garante que o grupo de destino existe
      const { data: grupoExiste, error: grupoError } = await this.supabase
        .from('grupo')
        .select('id_grupo, nome_grupo')
        .eq('id_grupo', id_novo_grupo)
        .single();

      if (grupoError || !grupoExiste) {
        this.logger.error(`[GRUPO_NAO_ENCONTRADO] Grupo ${id_novo_grupo} nao existe - Erro: ${grupoError?.message || 'Não encontrado'}`);
        throw new NotFoundException(`O grupo de destino com ID ${id_novo_grupo} não existe.`);
      }

      this.logger.log(`[GRUPO_VALIDADO] Grupo destino encontrado: ${grupoExiste.nome_grupo} (ID: ${id_novo_grupo})`);

      // Buscar dados atuais dos búfalos
      this.logger.debug(`[CONSULTA] Buscando dados atuais dos bufalos para comparacao`);

      const { data: bufalosAtuais, error: fetchError } = await this.supabase
        .from(this.tableName)
        .select('id_bufalo, nome, id_grupo, Grupo(nome_grupo)')
        .in('id_bufalo', uniqueIds);

      if (fetchError) {
        this.logger.error(`[ERRO_CONSULTA] Falha ao buscar dados dos bufalos: ${fetchError.message}`);
        throw new InternalServerErrorException(`Erro ao buscar dados dos búfalos: ${fetchError.message}`);
      }

      // Log dos búfalos encontrados vs solicitados
      const bufalosEncontrados = bufalosAtuais.map((b) => b.id_bufalo);
      const bufalosNaoEncontrados = uniqueIds.filter((id) => !bufalosEncontrados.includes(id));

      if (bufalosNaoEncontrados.length > 0) {
        this.logger.warn(`[BUFALOS_NAO_ENCONTRADOS] ${bufalosNaoEncontrados.length} bufalos nao encontrados: [${bufalosNaoEncontrados.join(', ')}]`);
      }

      // Filtrar apenas búfalos que realmente precisam ser movidos
      const bufalosParaMover = bufalosAtuais.filter((bufalo) => bufalo.id_grupo !== id_novo_grupo);
      const bufalosJaNoGrupo = bufalosAtuais.filter((bufalo) => bufalo.id_grupo === id_novo_grupo);

      if (bufalosJaNoGrupo.length > 0) {
        this.logger.log(
          `[JA_NO_GRUPO] ${bufalosJaNoGrupo.length} bufalos ja estao no grupo destino: [${bufalosJaNoGrupo.map((b) => `${b.nome}(${b.id_bufalo})`).join(', ')}]`,
        );
      }

      if (bufalosParaMover.length === 0) {
        this.logger.log(`[NENHUMA_ALTERACAO] Todos os bufalos ja estao no grupo destino - Operacao finalizada`);
        return {
          message: 'Todos os búfalos já estão no grupo de destino.',
          grupo_destino: grupoExiste.nome_grupo,
          total_processados: 0,
          animais: [],
        };
      }

      // Log da operação de movimentação
      this.logger.log(`[MOVIMENTACAO] Iniciando movimentacao de ${bufalosParaMover.length} bufalos para o grupo "${grupoExiste.nome_grupo}"`);

      bufalosParaMover.forEach((bufalo) => {
        this.logger.debug(
          `[DETALHE_MOVIMENTACAO] ${bufalo.nome}(${bufalo.id_bufalo}): "${(bufalo.Grupo as any)?.nome_grupo || 'N/A'}" -> "${grupoExiste.nome_grupo}"`,
        );
      });

      // Executa a atualização
      const idsParaMover = bufalosParaMover.map((b) => b.id_bufalo);
      const { data: bufalosAtualizados, error: updateError } = await this.supabase
        .from(this.tableName)
        .update({
          id_grupo: id_novo_grupo,
          updated_at: new Date().toISOString(),
        })
        .in('id_bufalo', idsParaMover)
        .select('id_bufalo, nome, id_grupo');

      if (updateError) {
        this.logger.error(`[ERRO_ATUALIZACAO] Falha na atualizacao do banco: ${updateError.message}`);
        throw new InternalServerErrorException(`Falha ao atualizar o grupo dos búfalos: ${updateError.message}`);
      }

      // Log de sucesso
      this.logger.log(`[SUCESSO] ${bufalosAtualizados.length} bufalos movidos com sucesso para o grupo "${grupoExiste.nome_grupo}"`);

      // Monta resposta detalhada
      const resultado = bufalosParaMover.map((bufalo) => ({
        id_bufalo: bufalo.id_bufalo,
        nome: bufalo.nome,
        grupo_anterior: (bufalo.Grupo as any)?.nome_grupo || 'N/A',
        grupo_novo: grupoExiste.nome_grupo,
      }));

      // Log final da operação
      this.logger.log(
        `[FINALIZACAO] Operacao concluida - Usuario: ${userId}, Bufalos movidos: ${bufalosAtualizados.length}, Grupo destino: "${grupoExiste.nome_grupo}"`,
      );

      return {
        message: `${bufalosAtualizados.length} búfalo(s) foram movidos para o grupo "${grupoExiste.nome_grupo}".`,
        grupo_destino: grupoExiste.nome_grupo,
        total_processados: bufalosAtualizados.length,
        motivo: motivo || null,
        animais: resultado,
        processado_em: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`[ERRO_GERAL] Falha na mudanca de grupo - Usuario: ${userId}, Erro: ${error.message}`, error.stack);
      throw error;
    }
  }

  async remove(id: string, user: any) {
    const userId = await this.getUserId(user);

    // Valida acesso ao búfalo
    await this.validateBufaloAccess(id, userId);

    const { error } = await this.supabase.from(this.tableName).delete().eq('id_bufalo', id);

    if (error) {
      throw new InternalServerErrorException('Falha ao remover o búfalo.');
    }
    return;
  }

  /**
   * Processa os dados do búfalo aplicando a lógica de maturidade e validações de idade
   */
  private async processMaturityData(dto: CreateBufaloDto | UpdateBufaloDto, existingBufalo?: any): Promise<any> {
    const processedDto = { ...dto };

    // Se há data de nascimento, processa a maturidade
    if (dto.dt_nascimento) {
      const birthDate = new Date(dto.dt_nascimento);

      // Valida idade máxima
      if (!BufaloValidationUtils.validateMaxAge(birthDate)) {
        processedDto.status = false; // Define como inativo se idade > 50 anos
      }

      // Se não foi informado nível de maturidade, calcula automaticamente
      if (!dto.nivel_maturidade) {
        const sexo = dto.sexo || existingBufalo?.sexo;
        if (sexo) {
          // Verifica se o búfalo tem descendentes (para determinar se é vaca/touro)
          const hasOffspring = await this.checkIfHasOffspring(existingBufalo?.id_bufalo);
          processedDto.nivel_maturidade = BufaloMaturityUtils.determineMaturityLevel(birthDate, sexo, hasOffspring);
        }
      }
    }

    return processedDto;
  }

  /**
   * Atualiza automaticamente a maturidade de búfalos quando necessário
   * Este método é chamado automaticamente em findAll e findOne
   * Só processa búfalos com status = true (ativos)
   */
  private async updateMaturityIfNeeded(bufalos: any[]): Promise<void> {
    if (!bufalos || bufalos.length === 0) return;

    // Filtrar apenas búfalos ativos (status = true)
    const bufalosAtivos = bufalos.filter((bufalo) => bufalo.status === true);

    if (bufalosAtivos.length === 0) return;

    const updates: MaturityUpdate[] = []; // Tipagem explícita do array

    for (const bufalo of bufalosAtivos) {
      if (bufalo.dt_nascimento && bufalo.sexo) {
        const birthDate = new Date(bufalo.dt_nascimento);
        const hasOffspring = await this.checkIfHasOffspring(bufalo.id_bufalo);

        const newMaturityLevel = BufaloMaturityUtils.determineMaturityLevel(birthDate, bufalo.sexo, hasOffspring);

        const shouldBeInactive = BufaloValidationUtils.validateMaxAge(birthDate) === false;

        // Só atualiza se houve mudança
        if (newMaturityLevel !== bufalo.nivel_maturidade || (shouldBeInactive && bufalo.status !== false)) {
          updates.push({
            id_bufalo: bufalo.id_bufalo,
            nivel_maturidade: newMaturityLevel,
            status: shouldBeInactive ? false : bufalo.status,
          });
        }
      }
    }

    // Executa atualizações em lote se necessário
    if (updates.length > 0) {
      console.log(`Atualizando maturidade de ${updates.length} búfalo(s) ativo(s)...`);

      for (const update of updates) {
        await this.supabase
          .from(this.tableName)
          .update({
            nivel_maturidade: update.nivel_maturidade,
            status: update.status,
          })
          .eq('id_bufalo', update.id_bufalo);
      }

      console.log(`Maturidade atualizada para ${updates.length} búfalo(s) ativo(s)`);
    }
  }

  /**
   * Verifica se um búfalo tem descendentes
   */
  private async checkIfHasOffspring(bufaloId?: number): Promise<boolean> {
    if (!bufaloId) return false;
    return this.genealogiaService.verificarSeTemDescendentes(bufaloId);
  }

  /**
   * Processa categoria ABCB do búfalo após criação/atualização
   */
  async processarCategoriaABCB(bufaloId: string): Promise<CategoriaABCB | null> {
    try {
      console.log(`Iniciando processamento da categoria ABCB para búfalo ${bufaloId}`);

      const bufalo = await this.buscarBufaloCompleto(bufaloId);
      if (!bufalo) {
        console.warn(`Búfalo ${bufaloId} não encontrado para processamento de categoria`);
        return null;
      }

      // Validação crítica: verifica se a propriedade foi carregada
      if (!bufalo.propriedade) {
        console.error(`ERRO: Propriedade não carregada para búfalo ${bufaloId}`);
        console.error('Estrutura do búfalo:', JSON.stringify(bufalo, null, 2));
        throw new InternalServerErrorException(
          `Não foi possível carregar os dados da propriedade para o búfalo ${bufalo.nome}. Verifique se a relação id_propriedade está correta.`,
        );
      }

      // Acessa a propriedade com o alias correto do Supabase (minúsculo)
      const propriedadeABCB = bufalo.propriedade?.p_abcb ?? false;

      console.log(`Búfalo encontrado: ${bufalo.nome}, Raça: ${bufalo.id_raca}, Propriedade ABCB: ${propriedadeABCB}`);

      // Constrói árvore genealógica usando serviço compartilhado
      console.log(`Construindo árvore genealógica para ${bufalo.nome}...`);
      const arvore = await this.genealogiaService.construirArvoreParaCategoria(bufaloId, 1);

      if (!arvore) {
        console.warn(`Não foi possível construir a árvore genealógica para ${bufalo.nome}`);
        return null;
      }

      console.log(`Árvore genealógica construída com sucesso para ${bufalo.nome}`);

      // Calcula categoria
      console.log(`Calculando categoria ABCB para ${bufalo.nome}...`);
      console.log(`Parâmetros: propriedadeABCB=${propriedadeABCB}, id_raca=${bufalo.id_raca}`);

      const categoria = CategoriaABCBUtil.calcularCategoria(arvore, propriedadeABCB);

      console.log(`Categoria calculada para ${bufalo.nome}: ${categoria}`);

      // Atualiza categoria no banco
      const { error } = await this.supabase.from(this.tableName).update({ categoria }).eq('id_bufalo', bufaloId);

      if (error) {
        console.error(`Erro ao salvar categoria ${categoria} para ${bufalo.nome}:`, error);
        throw new InternalServerErrorException(`Falha ao salvar categoria ABCB: ${error.message}`);
      }

      console.log(`Categoria ${categoria} salva com sucesso para ${bufalo.nome}`);
      return categoria;
    } catch (error) {
      console.error(`Erro no processamento da categoria ABCB para búfalo ${bufaloId}:`, error);

      if (error instanceof InternalServerErrorException) {
        throw error; // Re-throw erros já tratados
      }

      // Para outros erros, logga e retorna null
      return null;
    }
  }

  /**
   * Busca búfalo com dados completos
   */
  private async buscarBufaloCompleto(bufaloId: string): Promise<any> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select(
          `
          *,
          propriedade:id_propriedade (
            p_abcb,
            endereco (estado)
          )
        `,
        )
        .eq('id_bufalo', bufaloId)
        .single();

      if (error) {
        console.error(`Erro ao buscar dados completos do búfalo ${bufaloId}:`, error);
        console.error('Detalhes do erro:', JSON.stringify(error, null, 2));
        throw new InternalServerErrorException(`Falha ao buscar dados do búfalo: ${error.message}`);
      }

      if (!data) {
        console.warn(`Búfalo ${bufaloId} não encontrado no banco de dados`);
        return null;
      }

      // Validação adicional para garantir que temos os dados necessários
      if (!data.propriedade) {
        console.warn(`Propriedade não carregada para o búfalo ${bufaloId}`);
        console.warn('Dados do búfalo:', JSON.stringify(data, null, 2));
      }

      return data;
    } catch (error) {
      console.error(`Erro ao buscar búfalo completo ${bufaloId}:`, error);

      if (error instanceof InternalServerErrorException) {
        throw error;
      }

      return null;
    }
  }

  /**
   * Busca búfalos por categoria
   */
  async findByCategoria(categoria: CategoriaABCB, user: any) {
    const userId = await this.getUserId(user);

    // Busca as propriedades do usuário
    const propriedadesUsuario = await this.getUserPropriedades(userId);

    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(
        `
        *,
        raca:id_raca(nome),
        propriedade:id_propriedade(nome)
      `,
      )
      .in('id_propriedade', propriedadesUsuario)
      .eq('categoria', categoria)
      .eq('status', true);

    if (error) {
      console.error('❌ Erro ao buscar búfalos por categoria:', error);
      throw new InternalServerErrorException(`Falha ao buscar búfalos da categoria ${categoria}.`);
    }

    return data || [];
  }

  /**
   * Processa a categoria ABCB de todos os búfalos de uma propriedade
   * @param id_propriedade ID da propriedade
   * @param user Usuário logado
   * @returns Relatório do processamento
   */
  async processarCategoriaPropriedade(id_propriedade: string, user: any) {
    console.log(`🏠 Iniciando processamento de categorias para propriedade ${id_propriedade}`);

    const userId = await this.getUserId(user);
    const propriedadesUsuario = await this.getUserPropriedades(userId);

    // Valida acesso à propriedade
    if (!propriedadesUsuario.includes(id_propriedade)) {
      throw new NotFoundException(`Propriedade com ID ${id_propriedade} não encontrada ou você não tem acesso a ela.`);
    }

    // Busca todos os búfalos da propriedade
    const { data: bufalos, error } = await this.supabase
      .from(this.tableName)
      .select('id_bufalo, nome, categoria')
      .eq('id_propriedade', id_propriedade)
      .order('nome', { ascending: true });

    if (error) {
      console.error('❌ Erro ao buscar búfalos da propriedade:', error);
      throw new InternalServerErrorException(`Falha ao buscar búfalos da propriedade: ${error.message}`);
    }

    if (!bufalos || bufalos.length === 0) {
      return {
        message: 'Nenhum búfalo encontrado nesta propriedade',
        total: 0,
        processados: 0,
        sucesso: 0,
        erros: 0,
        detalhes: [],
      };
    }

    console.log(`📊 Total de búfalos encontrados: ${bufalos.length}`);

    const resultados = {
      total: bufalos.length,
      processados: 0,
      sucesso: 0,
      erros: 0,
      detalhes: [] as Array<{
        id_bufalo: string;
        nome: string;
        categoriaAntes: CategoriaABCB | null;
        categoriaDepois: CategoriaABCB | null;
        status: 'sucesso' | 'erro';
        mensagem?: string;
      }>,
    };

    // Processa cada búfalo
    for (const bufalo of bufalos) {
      resultados.processados++;
      console.log(`[${resultados.processados}/${bufalos.length}] Processando ${bufalo.nome}...`);

      try {
        const categoriaAntes = bufalo.categoria;
        const categoriaDepois = await this.processarCategoriaABCB(bufalo.id_bufalo);

        if (categoriaDepois !== null) {
          resultados.sucesso++;
          resultados.detalhes.push({
            id_bufalo: bufalo.id_bufalo,
            nome: bufalo.nome,
            categoriaAntes,
            categoriaDepois,
            status: 'sucesso',
            mensagem: categoriaAntes !== categoriaDepois ? 'Categoria atualizada' : 'Categoria mantida',
          });
          console.log(`✅ ${bufalo.nome}: ${categoriaAntes || 'null'} → ${categoriaDepois}`);
        } else {
          resultados.erros++;
          resultados.detalhes.push({
            id_bufalo: bufalo.id_bufalo,
            nome: bufalo.nome,
            categoriaAntes,
            categoriaDepois: null,
            status: 'erro',
            mensagem: 'Não foi possível processar a categoria',
          });
          console.warn(`⚠️ ${bufalo.nome}: Falha no processamento`);
        }
      } catch (error) {
        resultados.erros++;
        resultados.detalhes.push({
          id_bufalo: bufalo.id_bufalo,
          nome: bufalo.nome,
          categoriaAntes: bufalo.categoria,
          categoriaDepois: null,
          status: 'erro',
          mensagem: error.message || 'Erro desconhecido',
        });
        console.error(`❌ ${bufalo.nome}: ${error.message}`);
      }
    }

    console.log(`
🎉 Processamento concluído!
📊 Total: ${resultados.total}
✅ Sucesso: ${resultados.sucesso}
❌ Erros: ${resultados.erros}
    `);

    return {
      message: 'Processamento de categorias concluído',
      ...resultados,
    };
  }
}
