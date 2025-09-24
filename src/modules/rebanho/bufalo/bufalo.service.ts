import { Injectable, NotFoundException, InternalServerErrorException, BadRequestException, Logger } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from '../../../core/supabase/supabase.service';
import { CreateBufaloDto } from './dto/create-bufalo.dto';
import { UpdateBufaloDto } from './dto/update-bufalo.dto';
import { UpdateGrupoBufaloDto } from './dto/update-grupo-bufalo.dto';
import { BufaloMaturityUtils } from './utils/maturity.utils';
import { BufaloAgeUtils } from './utils/age.utils';
import { BufaloValidationUtils } from './utils/validation.utils';
import { NivelMaturidade } from './dto/create-bufalo.dto';
import { CategoriaABCBUtil } from './utils/categoria-abcb.util';
import { GeminiRacaUtil } from './utils/gemini-raca.util';
import { CategoriaABCB } from './dto/categoria-abcb.dto';
import { GenealogiaService } from '../../reproducao/genealogia/genealogia.service';

// Interface para tipar as atualizações de maturidade
interface MaturityUpdate {
  id_bufalo: number;
  nivel_maturidade: NivelMaturidade;
  status: boolean;
}

@Injectable()
export class BufaloService {
  private readonly logger = new Logger(BufaloService.name);
  private supabase: SupabaseClient;
  private readonly tableName = 'Bufalo';

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly geminiRacaUtil: GeminiRacaUtil,
    private readonly genealogiaService: GenealogiaService,
  ) {
    this.supabase = this.supabaseService.getClient();
  }

  private async getUserId(user: any): Promise<number> {
    const { data: perfilUsuario, error } = await this.supabase.from('Usuario').select('id_usuario').eq('email', user.email).single();

    if (error || !perfilUsuario) {
      throw new NotFoundException('Perfil de usuário não encontrado.');
    }
    return perfilUsuario.id_usuario;
  }

  /**
   * Busca todas as propriedades vinculadas ao usuário (como dono OU funcionário)
   */
  private async getUserPropriedades(userId: number): Promise<number[]> {
    // 1. Busca propriedades onde o usuário é DONO
    const { data: propriedadesComoDono, error: errorDono } = await this.supabase.from('Propriedade').select('id_propriedade').eq('id_dono', userId);

    // 2. Busca propriedades onde o usuário é FUNCIONÁRIO
    const { data: propriedadesComoFuncionario, error: errorFuncionario } = await this.supabase
      .from('UsuarioPropriedade')
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
  private async validateBufaloAccess(bufaloId: number, userId: number): Promise<void> {
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
    const checkIfExists = async (tableName: string, columnName: string, id: number) => {
      const { data, error } = await this.supabase.from(tableName).select(columnName).eq(columnName, id).single();
      if (error || !data) {
        throw new NotFoundException(`${tableName} com ID ${id} não encontrado.`);
      }
    };

    if (dto.id_raca) await checkIfExists('Raca', 'id_raca', dto.id_raca);
    if (dto.id_grupo) await checkIfExists('Grupo', 'id_grupo', dto.id_grupo);
    if (dto.id_pai) await checkIfExists('Bufalo', 'id_bufalo', dto.id_pai);
    if (dto.id_mae) await checkIfExists('Bufalo', 'id_bufalo', dto.id_mae);
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

    // Remove qualquer id_bufalo que possa estar sendo enviado
    const { id_bufalo, ...insertDto } = processedDto;
    console.log('BufaloService.create - DTO final (sem id_bufalo):', JSON.stringify(insertDto, null, 2));

    // Busca o próximo ID disponível para evitar conflitos
    let maxIdResult;
    try {
      console.log('BufaloService.create - Buscando próximo ID...');
      maxIdResult = await this.supabase.from(this.tableName).select('id_bufalo').order('id_bufalo', { ascending: false }).limit(1).single();
    } catch (maxIdError) {
      console.log('BufaloService.create - Sem registros existentes, começando do ID 1');
    }

    const nextId = maxIdResult?.data?.id_bufalo ? maxIdResult.data.id_bufalo + 1 : 1;
    const insertDtoWithId = { ...insertDto, id_bufalo: nextId };
    console.log('BufaloService.create - Próximo ID calculado:', nextId);

    const { data, error } = await this.supabase.from(this.tableName).insert(insertDtoWithId).select().single();

    if (error) {
      console.error('BufaloService.create - Erro ao inserir:', error);
      if (error.code === '23503') {
        // Erro de chave estrangeira
        throw new BadRequestException('Falha ao criar búfalo: uma das referências (raça, grupo, etc.) é inválida.');
      }
      throw new InternalServerErrorException(`Falha ao criar o búfalo: ${error.message}`);
    }

    console.log('BufaloService.create - Búfalo criado com sucesso:', data);

    // Processa categoria ABCB em background
    if (data?.id_bufalo) {
      setTimeout(async () => {
        try {
          await this.processarCategoriaABCB(data.id_bufalo);
        } catch (error) {
          console.error('Erro ao processar categoria ABCB em background:', error);
        }
      }, 1000);
    }

    return data;
  }

  async findAll(user: any) {
    const userId = await this.getUserId(user);

    // Busca as propriedades do usuário
    const propriedadesUsuario = await this.getUserPropriedades(userId);

    // Busca búfalos de todas as propriedades vinculadas ao usuário
    const { data, error } = await this.supabase.from(this.tableName).select('*').in('id_propriedade', propriedadesUsuario);

    if (error) {
      throw new InternalServerErrorException('Falha ao buscar os búfalos.');
    }

    // Atualiza maturidade automaticamente para búfalos que precisam
    await this.updateMaturityIfNeeded(data || []);

    return data || [];
  }

  async findOne(id: number, user: any) {
    const userId = await this.getUserId(user);

    // Valida acesso antes de buscar os dados completos
    await this.validateBufaloAccess(id, userId);

    const { data, error } = await this.supabase.from(this.tableName).select('*').eq('id_bufalo', id).single();

    if (error || !data) {
      throw new NotFoundException(`Búfalo com ID ${id} não encontrado.`);
    }

    // Atualiza maturidade automaticamente se necessário
    await this.updateMaturityIfNeeded([data]);

    return data;
  }

  async findByMicrochip(microchip: string) {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(
        `
        *,
        raca:id_raca(nome, origem),
        lote:id_lote(nome),
        propriedade:id_propriedade(nome)
      `,
      )
      .eq('microchip', microchip)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Búfalo com microchip ${microchip} não encontrado.`);
    }

    // Atualiza maturidade automaticamente se necessário
    await this.updateMaturityIfNeeded([data]);

    return data;
  }

  async update(id: number, updateDto: UpdateBufaloDto, user: any) {
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

    // Processa categoria ABCB em background
    setTimeout(async () => {
      try {
        await this.processarCategoriaABCB(id);
      } catch (error) {
        console.error('Erro ao processar categoria ABCB em background:', error);
      }
    }, 1000);

    return data;
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
        .from('Grupo')
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

  async remove(id: number, user: any) {
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
   */
  private async updateMaturityIfNeeded(bufalos: any[]): Promise<void> {
    if (!bufalos || bufalos.length === 0) return;

    const updates: MaturityUpdate[] = []; // Tipagem explícita do array

    for (const bufalo of bufalos) {
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
      console.log(`Atualizando maturidade de ${updates.length} búfalo(s)...`);

      for (const update of updates) {
        await this.supabase
          .from(this.tableName)
          .update({
            nivel_maturidade: update.nivel_maturidade,
            status: update.status,
          })
          .eq('id_bufalo', update.id_bufalo);
      }

      console.log(`Maturidade atualizada para ${updates.length} búfalo(s)`);
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
  async processarCategoriaABCB(bufaloId: number): Promise<CategoriaABCB | null> {
    try {
      console.log(`Iniciando processamento da categoria ABCB para búfalo ${bufaloId}`);

      const bufalo = await this.buscarBufaloCompleto(bufaloId);
      if (!bufalo) {
        console.warn(`Búfalo ${bufaloId} não encontrado para processamento de categoria`);
        return null;
      }

      console.log(`Búfalo encontrado: ${bufalo.nome}, Raça: ${bufalo.id_raca}, Propriedade ABCB: ${bufalo.Propriedade?.p_abcb}`);

      // Se não tem raça definida, tenta sugerir com Gemini
      if (!bufalo.id_raca) {
        console.log(`Tentando sugerir raça com Gemini para ${bufalo.nome}...`);
        try {
          await this.tentarSugerirRaca(bufalo);
          // Recarrega búfalo após possível atualização de raça
          const bufaloAtualizado = await this.buscarBufaloCompleto(bufaloId);
          if (bufaloAtualizado) {
            Object.assign(bufalo, bufaloAtualizado);
            console.log(`Búfalo atualizado, nova raça: ${bufalo.id_raca}`);
          }
        } catch (error) {
          console.warn(`Falha ao sugerir raça para ${bufalo.nome}:`, error.message);
          // Continua o processamento mesmo sem raça
        }
      }

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
      console.log(`Parâmetros: propriedadeABCB=${bufalo.Propriedade.p_abcb}, temRaca=${Boolean(bufalo.id_raca)}`);

      const categoria = CategoriaABCBUtil.calcularCategoria(arvore, bufalo.Propriedade.p_abcb, Boolean(bufalo.id_raca));

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
   * Tenta sugerir raça usando Gemini baseado em características físicas
   */
  private async tentarSugerirRaca(bufalo: any): Promise<void> {
    try {
      // Busca dados zootécnicos mais recentes
      const { data: dadosZootecnicos, error: errorZootec } = await this.supabase
        .from('DadosZootecnicos')
        .select('*')
        .eq('id_bufalo', bufalo.id_bufalo)
        .order('dt_registro', { ascending: false })
        .limit(1)
        .single();

      if (errorZootec || !dadosZootecnicos) {
        console.warn(`Dados zootécnicos não encontrados para ${bufalo.nome}, pulando sugestão de raça`);
        return;
      }

      const caracteristicas = {
        cor_pelagem: dadosZootecnicos.cor_pelagem,
        formato_chifre: dadosZootecnicos.formato_chifre,
        porte_corporal: dadosZootecnicos.porte_corporal,
        peso: dadosZootecnicos.peso,
        regiao_origem: bufalo.Propriedade?.Endereco?.estado,
      };

      console.log(`Solicitando sugestão de raça para ${bufalo.nome} via Gemini...`);
      const idRacaSugerida = await this.geminiRacaUtil.sugerirRacaBufalo(caracteristicas, this.supabase);

      if (idRacaSugerida) {
        const { error: errorUpdate } = await this.supabase.from(this.tableName).update({ id_raca: idRacaSugerida }).eq('id_bufalo', bufalo.id_bufalo);

        if (errorUpdate) {
          console.error(`Erro ao atualizar raça sugerida para ${bufalo.nome}:`, errorUpdate);
          throw new InternalServerErrorException(`Falha ao salvar raça sugerida: ${errorUpdate.message}`);
        }

        console.log(`Raça ${idRacaSugerida} sugerida e salva para ${bufalo.nome}`);
      } else {
        console.warn(`Gemini não conseguiu sugerir uma raça para ${bufalo.nome}`);
      }
    } catch (error) {
      console.error(`Erro ao tentar sugerir raça para ${bufalo.nome}:`, error);
      throw error; // Re-throw para que o caller possa tratar
    }
  }

  /**
   * Busca búfalo com dados completos
   */
  private async buscarBufaloCompleto(bufaloId: number): Promise<any> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select(
          `
          *,
          Propriedade!inner (
            p_abcb,
            Endereco (estado)
          )
        `,
        )
        .eq('id_bufalo', bufaloId)
        .single();

      if (error) {
        console.error(`Erro ao buscar dados completos do búfalo ${bufaloId}:`, error);
        throw new InternalServerErrorException(`Falha ao buscar dados do búfalo: ${error.message}`);
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
        Raca (nome),
        Propriedade (nome)
      `,
      )
      .in('id_propriedade', propriedadesUsuario)
      .eq('categoria', categoria)
      .eq('status', true);

    if (error) {
      throw new InternalServerErrorException(`Falha ao buscar búfalos da categoria ${categoria}.`);
    }

    return data || [];
  }
}
