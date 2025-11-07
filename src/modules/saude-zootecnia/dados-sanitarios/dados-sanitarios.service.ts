import { Injectable, InternalServerErrorException, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { SupabaseService } from '../../../core/supabase/supabase.service';
import { CreateDadosSanitariosDto } from './dto/create-dados-sanitarios.dto';
import { UpdateDadosSanitariosDto } from './dto/update-dados-sanitarios.dto';
import { PaginationDto, PaginatedResponse } from '../../../core/dto/pagination.dto';
import { createPaginatedResponse, calculatePaginationParams } from '../../../core/utils/pagination.utils';
import { formatDateFields, formatDateFieldsArray } from '../../../core/utils/date-formatter.utils';
import { FrequenciaDoencasResponseDto } from './dto/frequencia-doencas.dto';
import { StringSimilarityUtil } from '../../../core/utils/string-similarity.utils';
import { DoencaNormalizerUtil } from './utils/doenca-normalizer.utils';
import { AlertasService } from '../../alerta/alerta.service';
import { NichoAlerta, PrioridadeAlerta } from '../../alerta/dto/create-alerta.dto';

@Injectable()
export class DadosSanitariosService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly alertasService: AlertasService,
  ) {}

  private readonly tableName = 'dadossanitarios';
  private readonly tableMedicacoes = 'medicacoes';

  /**
   * Função auxiliar para encontrar o ID numérico interno (bigint) do utilizador
   * a partir do UUID de autenticação do Supabase (o 'sub' do JWT).
   */
  private async getInternalUserId(authUuid: string): Promise<number> {
    const { data, error } = await this.supabase.getAdminClient().from('usuario').select('id_usuario').eq('auth_id', authUuid).single();

    if (error || !data) {
      throw new UnauthorizedException(
        `Falha na sincronização do utilizador. O utilizador (auth: ${authUuid}) não foi encontrado no registo local 'Usuario'.`,
      );
    }

    return data.id_usuario;
  }

  /**
   * Normaliza o nome da doença para o nome correto
   * Usa o dicionário de doenças conhecidas e algoritmo de similaridade
   * para corrigir automaticamente erros de digitação
   */
  private normalizeDoenca(doenca: string | undefined): string | undefined {
    if (!doenca) return undefined;

    return DoencaNormalizerUtil.normalize(doenca, 0.85);
  }

  /**
   * O parâmetro 'auth_uuid' é o 'sub' (string UUID) vindo do controller.
   */
  async create(dto: CreateDadosSanitariosDto, auth_uuid: string) {
    // 1. Validar se a medicação existe
    const { data: medicacao, error: errorMedicacao } = await this.supabase
      .getAdminClient()
      .from(this.tableMedicacoes)
      .select('id_medicacao')
      .eq('id_medicacao', dto.id_medicao)
      .single();

    if (errorMedicacao || !medicacao) {
      throw new BadRequestException(`Medicação com ID ${dto.id_medicao} não encontrada.`);
    }

    // 2. Traduzir o Auth UUID (string) para o ID interno (bigint)
    const internalUserId = await this.getInternalUserId(auth_uuid);

    // 3. Normalizar o nome da doença antes de salvar
    const doencaNormalizada = this.normalizeDoenca(dto.doenca);

    // 4. Inserir no banco de dados usando o ID numérico (bigint) correto
    const { data, error } = await this.supabase
      .getAdminClient()
      .from(this.tableName)
      .insert({
        ...dto,
        doenca: doencaNormalizada, // Salva a doença normalizada
        id_usuario: internalUserId, // <-- CORRIGIDO: Inserindo o ID numérico correto
      })
      .select()
      .single();

    if (error) {
      throw new InternalServerErrorException(`Falha ao criar dado sanitário: ${error.message}`);
    }

    // 5. CRIAR ALERTA CLÍNICO AUTOMÁTICO para doenças graves
    try {
      const doencasGraves = [
        'brucelose',
        'tuberculose',
        'raiva',
        'carbúnculo',
        'mastite gangrenosa',
        'pneumonia severa',
        'septicemia',
        'leptospirose',
        'febre aftosa',
      ];

      const doencaLower = doencaNormalizada?.toLowerCase() || '';
      const isGrave = doencasGraves.some((grave) => doencaLower.includes(grave));

      if (isGrave) {
        // Buscar informações do búfalo
        const { data: bufaloData } = await this.supabase
          .getAdminClient()
          .from('bufalo')
          .select('id_bufalo, nome, id_grupo, id_propriedade')
          .eq('id_bufalo', dto.id_bufalo)
          .single();

        if (bufaloData) {
          let grupoNome = 'Não informado';
          if (bufaloData.id_grupo) {
            const { data: grupoData } = await this.supabase
              .getAdminClient()
              .from('grupo')
              .select('nome_grupo')
              .eq('id_grupo', bufaloData.id_grupo)
              .single();
            if (grupoData) grupoNome = grupoData.nome_grupo;
          }

          let propriedadeNome = 'Não informada';
          if (bufaloData.id_propriedade) {
            const { data: propData } = await this.supabase
              .getAdminClient()
              .from('propriedade')
              .select('nome')
              .eq('id_propriedade', bufaloData.id_propriedade)
              .single();
            if (propData) propriedadeNome = propData.nome;
          }

          await this.alertasService.createIfNotExists({
            animal_id: bufaloData.id_bufalo,
            grupo: grupoNome,
            localizacao: propriedadeNome,
            id_propriedade: bufaloData.id_propriedade,
            motivo: `⚠️ ATENÇÃO: ${bufaloData.nome} diagnosticado(a) com ${doencaNormalizada}.`,
            nicho: NichoAlerta.CLINICO,
            data_alerta: new Date().toISOString().split('T')[0],
            prioridade: PrioridadeAlerta.ALTA,
            observacao: `Doença grave detectada: ${doencaNormalizada}. Monitorar evolução clínica e isolamento se necessário.`,
            id_evento_origem: data.id_sanit,
            tipo_evento_origem: 'DADOS_SANITARIOS_GRAVE',
          });

          console.log(`✅ Alerta clínico criado para ${bufaloData.nome} - ${doencaNormalizada}`);
        }
      }
    } catch (alertaError) {
      // Não bloqueia o fluxo se o alerta falhar
      console.error('⚠️ Erro ao criar alerta clínico:', alertaError);
    }

    return formatDateFields(data);
  }

  async findAll(paginationDto: PaginationDto = {}): Promise<PaginatedResponse<any>> {
    const { page = 1, limit = 10 } = paginationDto;
    const { offset } = calculatePaginationParams(page, limit);

    // Primeiro, busca o total de registros
    const { count, error: countError } = await this.supabase.getAdminClient().from(this.tableName).select('*', { count: 'exact', head: true });

    if (countError) {
      throw new InternalServerErrorException(`Falha ao contar registros sanitários: ${countError.message}`);
    }

    const { data, error } = await this.supabase
      .getAdminClient()
      .from(this.tableName)
      .select(
        `
        *,
        bufalo:id_bufalo(id_bufalo, nome, brinco, id_propriedade)
      `,
      )
      .order('dt_aplicacao', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new InternalServerErrorException(`Falha ao buscar dados sanitários: ${error.message}`);
    }

    const formattedData = formatDateFieldsArray(data || []);
    return createPaginatedResponse(formattedData, count || 0, page, limit);
  }

  async findByBufalo(id_bufalo: string, paginationDto: PaginationDto = {}): Promise<PaginatedResponse<any>> {
    const { page = 1, limit = 10 } = paginationDto;
    const { offset } = calculatePaginationParams(page, limit);

    // Primeiro, busca o total de registros para o búfalo
    const { count, error: countError } = await this.supabase
      .getAdminClient()
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
      .eq('id_bufalo', id_bufalo);

    if (countError) {
      throw new InternalServerErrorException(`Falha ao contar registros sanitários do búfalo: ${countError.message}`);
    }

    const { data, error } = await this.supabase
      .getAdminClient()
      .from(this.tableName)
      .select('*')
      .eq('id_bufalo', id_bufalo)
      .order('dt_aplicacao', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new InternalServerErrorException(`Falha ao buscar dados sanitários do búfalo: ${error.message}`);
    }

    const formattedData = formatDateFieldsArray(data || []);
    return createPaginatedResponse(formattedData, count || 0, page, limit);
  }

  async findByPropriedade(id_propriedade: string, paginationDto: PaginationDto = {}): Promise<PaginatedResponse<any>> {
    const { page = 1, limit = 10 } = paginationDto;
    const { offset } = calculatePaginationParams(page, limit);

    // Primeiro, busca o total de registros para a propriedade (através do JOIN com búfalos)
    const { count, error: countError } = await this.supabase
      .getAdminClient()
      .from(this.tableName)
      .select('id_sanit, bufalo!inner(id_propriedade)', { count: 'exact', head: true })
      .eq('bufalo.id_propriedade', id_propriedade);

    if (countError) {
      throw new InternalServerErrorException(`Falha ao contar registros sanitários da propriedade: ${countError.message}`);
    }

    // Busca os registros com informações do búfalo
    const { data, error } = await this.supabase
      .getAdminClient()
      .from(this.tableName)
      .select(
        `
        *,
        bufalo:id_bufalo(id_bufalo, nome, brinco, id_propriedade)
      `,
      )
      .eq('bufalo.id_propriedade', id_propriedade)
      .order('dt_aplicacao', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new InternalServerErrorException(`Falha ao buscar dados sanitários da propriedade: ${error.message}`);
    }

    const formattedData = formatDateFieldsArray(data || []);
    return createPaginatedResponse(formattedData, count || 0, page, limit);
  }

  async findOne(id_sanit: string) {
    const { data, error } = await this.supabase.getAdminClient().from(this.tableName).select('*').eq('id_sanit', id_sanit).single();

    if (error || !data) {
      throw new NotFoundException(`Dado sanitário com ID ${id_sanit} não encontrado.`);
    }
    return formatDateFields(data);
  }

  async update(id_sanit: string, dto: UpdateDadosSanitariosDto) {
    await this.findOne(id_sanit);

    if (dto.id_medicao) {
      const { data: medicacao, error: errorMedicacao } = await this.supabase
        .getAdminClient()
        .from(this.tableMedicacoes)
        .select('id_medicacao')
        .eq('id_medicao', dto.id_medicao)
        .single();

      if (errorMedicacao || !medicacao) {
        throw new BadRequestException(`Medicação com ID ${dto.id_medicao} não encontrada.`);
      }
    }

    // Normalizar a doença se estiver sendo atualizada
    const updateData = {
      ...dto,
      ...(dto.doenca !== undefined && { doenca: this.normalizeDoenca(dto.doenca) }),
    };

    const { data, error } = await this.supabase.getAdminClient().from(this.tableName).update(updateData).eq('id_sanit', id_sanit).select().single();

    if (error) {
      throw new InternalServerErrorException(`Falha ao atualizar dado sanitário: ${error.message}`);
    }
    return formatDateFields(data);
  }

  async remove(id_sanit: string) {
    await this.findOne(id_sanit);

    const { error } = await this.supabase.getAdminClient().from(this.tableName).delete().eq('id_sanit', id_sanit);

    if (error) {
      throw new InternalServerErrorException(`Falha ao remover dado sanitário: ${error.message}`);
    }
    return { message: 'Registro removido com sucesso' };
  }

  /**
   * Retorna a frequência de doenças registradas na propriedade
   * Normaliza os nomes das doenças para lowercase para evitar duplicatas
   * @param id_propriedade ID da propriedade
   * @param agruparSimilares Se true, agrupa doenças com nomes similares (ex: erros de digitação)
   * @param limiarSimilaridade Limiar de similaridade para agrupamento (0-1, padrão 0.8)
   */
  async getFrequenciaDoencas(id_propriedade: string, agruparSimilares = false, limiarSimilaridade = 0.8): Promise<FrequenciaDoencasResponseDto> {
    // Busca todos os búfalos da propriedade
    const { data: bufalos, error: bufaloError } = await this.supabase
      .getAdminClient()
      .from('bufalo')
      .select('id_bufalo')
      .eq('id_propriedade', id_propriedade);

    if (bufaloError) {
      throw new InternalServerErrorException(`Falha ao buscar búfalos da propriedade: ${bufaloError.message}`);
    }

    if (!bufalos || bufalos.length === 0) {
      return {
        dados: [],
        total_registros: 0,
        total_doencas_distintas: 0,
      };
    }

    const bufaloIds = bufalos.map((b) => b.id_bufalo);

    // Busca todos os registros sanitários dos búfalos que possuem doença registrada
    const { data, error } = await this.supabase
      .getAdminClient()
      .from(this.tableName)
      .select('doenca')
      .in('id_bufalo', bufaloIds)
      .not('doenca', 'is', null);

    if (error) {
      console.error('❌ DEBUG - Erro ao buscar doenças:', error);
      throw new InternalServerErrorException(`Falha ao buscar dados de doenças: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return {
        dados: [],
        total_registros: 0,
        total_doencas_distintas: 0,
      };
    }

    const frequenciaMap = new Map<string, number>();

    if (agruparSimilares) {
      // Agrupa doenças similares usando o algoritmo de Levenshtein
      const doencasUnicas = Array.from(new Set(data.map((r) => r.doenca?.toLowerCase().trim()).filter((d): d is string => !!d)));

      const grupos = StringSimilarityUtil.groupSimilarStrings(doencasUnicas, limiarSimilaridade);

      data.forEach((registro) => {
        if (registro.doenca) {
          const doencaNormalizada = registro.doenca.toLowerCase().trim();

          // Encontra o grupo desta doença (usa o primeiro elemento do grupo como chave)
          const grupoKey = Array.from(grupos.keys()).find((key) => grupos.get(key)!.includes(doencaNormalizada));

          const chave = grupoKey || doencaNormalizada;
          const count = frequenciaMap.get(chave) || 0;
          frequenciaMap.set(chave, count + 1);
        }
      });
    } else {
      // Versão simples: apenas normaliza sem agrupamento
      data.forEach((registro) => {
        if (registro.doenca) {
          const doencaNormalizada = registro.doenca.toLowerCase().trim();
          const count = frequenciaMap.get(doencaNormalizada) || 0;
          frequenciaMap.set(doencaNormalizada, count + 1);
        }
      });
    }

    // Converte o Map para array e ordena por frequência (decrescente)
    const doencasOrdenadas = Array.from(frequenciaMap.entries())
      .map(([doenca, frequencia]) => ({ doenca, frequencia }))
      .sort((a, b) => b.frequencia - a.frequencia);

    return {
      dados: doencasOrdenadas,
      total_registros: data.length,
      total_doencas_distintas: doencasOrdenadas.length,
    };
  }

  /**
   * Retorna sugestões de nomes de doenças para autocomplete
   * @param termo Termo de busca (opcional)
   * @param limit Número máximo de sugestões
   */
  async getSugestoesDoencas(termo?: string, limit = 5): Promise<string[]> {
    return DoencaNormalizerUtil.getSugestoes(termo || '', limit);
  }

  /**
   * [MIGRAÇÃO] Normaliza todas as doenças existentes no banco
   * Execute este método UMA VEZ após implementar a normalização
   *
   * @returns Estatísticas da migração com detalhes das atualizações
   */
  async migrarNormalizacaoDoencas() {
    // 1. Busca todos os registros com doença
    const { data: registros, error: fetchError } = await this.supabase
      .getAdminClient()
      .from(this.tableName)
      .select('id_sanit, doenca')
      .not('doenca', 'is', null);

    if (fetchError) {
      throw new InternalServerErrorException(`Falha ao buscar registros: ${fetchError.message}`);
    }

    if (!registros || registros.length === 0) {
      return {
        message: 'Nenhum registro encontrado para normalizar',
        total: 0,
        atualizados: 0,
      };
    }

    // 2. Normaliza cada doença e atualiza
    const updates: Array<{ id: string; de: string; para: string }> = [];
    const erros: Array<{ id: string; doenca_original: string; erro: string }> = [];

    for (const registro of registros) {
      const doencaNormalizada = this.normalizeDoenca(registro.doenca);

      // Só atualiza se a doença mudou
      if (doencaNormalizada && doencaNormalizada !== registro.doenca) {
        const { error: updateError } = await this.supabase
          .getAdminClient()
          .from(this.tableName)
          .update({ doenca: doencaNormalizada })
          .eq('id_sanit', registro.id_sanit);

        if (updateError) {
          erros.push({
            id: registro.id_sanit,
            doenca_original: registro.doenca,
            erro: updateError.message,
          });
        } else {
          updates.push({
            id: registro.id_sanit,
            de: registro.doenca,
            para: doencaNormalizada,
          });
        }
      }
    }

    return {
      message: 'Migração concluída',
      total: registros.length,
      atualizados: updates.length,
      sem_alteracao: registros.length - updates.length - erros.length,
      detalhes: updates,
      erros: erros.length > 0 ? erros : undefined,
    };
  }
}
