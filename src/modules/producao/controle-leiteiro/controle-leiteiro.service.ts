import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
  Logger,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from '../../../core/supabase/supabase.service';
import { LoggerService } from '../../../core/logger/logger.service';
import { CreateDadosLactacaoDto } from './dto/create-dados-lactacao.dto';
import { UpdateDadosLactacaoDto } from './dto/update-dados-lactacao.dto';
import { AlertasService } from '../../alerta/alerta.service';
import { CreateAlertaDto, NichoAlerta, PrioridadeAlerta } from '../../alerta/dto/create-alerta.dto';
import { GeminiService } from '../../../core/gemini/gemini.service';
import { FemeaEmLactacaoDto } from './dto/femea-em-lactacao.dto';
import { ResumoProducaoBufalaDto } from './dto/resumo-producao-bufala.dto';
import { formatDateFields, formatDateFieldsArray } from '../../../core/utils/date-formatter.utils';

@Injectable()
export class ControleLeiteiroService {
  private readonly logger = new Logger(ControleLeiteiroService.name);
  private supabase: SupabaseClient;

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly alertasService: AlertasService,
    private readonly geminiService: GeminiService,
    private readonly customLogger: LoggerService,
  ) {
    this.supabase = this.supabaseService.getAdminClient();
  }

  /**
   * Método privado para obter o ID numérico do usuário a partir do token.
   */
  private async getUserId(user: any): Promise<number> {
    const { data: perfilUsuario, error } = await this.supabase.from('usuario').select('id_usuario').eq('email', user.email).single();

    if (error || !perfilUsuario) {
      throw new NotFoundException('Perfil de usuário não encontrado.');
    }
    return perfilUsuario.id_usuario;
  }

  /**
   * Cria um registro de lactação, associando-o ao usuário autenticado.
   * Se houver uma ocorrência clínica, cria um alerta associado.
   */
  async create(createDto: CreateDadosLactacaoDto, user: any) {
    this.customLogger.log('Iniciando criação de registro de lactação', {
      module: 'ControleLeiteiroService',
      method: 'create',
      bufalaId: createDto.id_bufala,
      dtOrdenha: createDto.dt_ordenha,
    });

    const idUsuario = await this.getUserId(user);
    this.customLogger.log('ID do usuário obtido com sucesso', {
      module: 'ControleLeiteiroService',
      method: 'create',
      userId: String(idUsuario),
    });

    const dtoToInsert = { ...createDto, id_usuario: idUsuario };

    const { data: lactacaoData, error } = await this.supabase.from('dadoslactacao').insert(dtoToInsert).select().single();

    if (error) {
      if (error.code === '23503') {
        this.customLogger.warn('Búfala não encontrada', {
          module: 'ControleLeiteiroService',
          method: 'create',
          bufalaId: createDto.id_bufala,
        });
        throw new BadRequestException(`A búfala com id ${createDto.id_bufala} não foi encontrada.`);
      }
      this.customLogger.logError(error, {
        module: 'ControleLeiteiroService',
        method: 'create',
        bufalaId: createDto.id_bufala,
      });
      throw new InternalServerErrorException('Falha ao criar o dado de lactação.');
    }

    if (!lactacaoData) {
      this.customLogger.error('Falha ao obter dados do registro criado', undefined, {
        module: 'ControleLeiteiroService',
        method: 'create',
        userId: String(idUsuario),
      });
      throw new InternalServerErrorException('Falha ao obter dados do registro de lactação criado.');
    }

    this.customLogger.log('Registro de lactação criado com sucesso', {
      module: 'ControleLeiteiroService',
      method: 'create',
      lactacaoId: lactacaoData.id_lact,
      bufalaId: createDto.id_bufala,
    });

    // Lógica para criação de Alerta
    if (createDto.ocorrencia && createDto.ocorrencia.trim() !== '') {
      this.customLogger.log('Processando alerta para ocorrência clínica', {
        module: 'ControleLeiteiroService',
        method: 'create',
        lactacaoId: lactacaoData.id_lact,
        ocorrencia: createDto.ocorrencia,
      });

      this.processarAlertaOcorrencia(createDto, lactacaoData).catch((alertaError) => {
        this.customLogger.logError(alertaError, {
          module: 'ControleLeiteiroService',
          method: 'processarAlertaOcorrencia',
          lactacaoId: lactacaoData.id_lact,
        });
      });
    }

    return formatDateFields(lactacaoData);
  }

  /**
   * Método privado para processar a criação de alerta quando há ocorrência clínica.
   */
  private async processarAlertaOcorrencia(createDto: CreateDadosLactacaoDto, lactacaoData: any): Promise<void> {
    try {
      this.customLogger.log('Buscando informações do búfalo para alerta', {
        module: 'ControleLeiteiroService',
        method: 'processarAlertaOcorrencia',
        bufalaId: createDto.id_bufala,
      });

      // Buscar informações do búfalo sem relacionamentos complexos
      const { data: bufaloInfo, error: bufaloError } = await this.supabase
        .from('bufalo')
        .select('id_bufalo, id_grupo, id_propriedade, nome')
        .eq('id_bufalo', createDto.id_bufala)
        .single();

      if (bufaloError) {
        this.customLogger.logError(bufaloError, {
          module: 'ControleLeiteiroService',
          method: 'processarAlertaOcorrencia',
          bufalaId: createDto.id_bufala,
        });
        throw new Error(`Falha ao buscar informações do búfalo: ${bufaloError.message}`);
      }

      if (!bufaloInfo) {
        this.customLogger.warn('Informações do búfalo não encontradas', {
          module: 'ControleLeiteiroService',
          method: 'processarAlertaOcorrencia',
          bufalaId: createDto.id_bufala,
        });
        throw new Error('Informações do búfalo não encontradas.');
      }

      // Buscar informações do grupo se existir
      let grupoNome = 'Sem grupo';
      if (bufaloInfo.id_grupo) {
        const { data: grupoData } = await this.supabase.from('grupo').select('nome_grupo').eq('id_grupo', bufaloInfo.id_grupo).single();

        if (grupoData) {
          grupoNome = grupoData.nome_grupo;
        }
      }

      // Buscar informações da propriedade
      let propriedadeNome = 'Não informada';
      if (bufaloInfo.id_propriedade) {
        const { data: propData } = await this.supabase.from('propriedade').select('nome').eq('id_propriedade', bufaloInfo.id_propriedade).single();

        if (propData) {
          propriedadeNome = propData.nome;
        }
      }

      this.customLogger.log('Classificando prioridade da ocorrência com IA', {
        module: 'ControleLeiteiroService',
        method: 'processarAlertaOcorrencia',
        bufalaId: createDto.id_bufala,
        ocorrencia: createDto.ocorrencia,
      });

      // Classificar prioridade usando Gemini
      const prioridadeClassificada = await this.geminiService.classificarPrioridadeOcorrencia(createDto.ocorrencia!);

      this.customLogger.log('Criando alerta para ocorrência clínica', {
        module: 'ControleLeiteiroService',
        method: 'processarAlertaOcorrencia',
        bufalaId: createDto.id_bufala,
        prioridade: prioridadeClassificada,
      });

      const alertaDto: CreateAlertaDto = {
        animal_id: createDto.id_bufala,
        grupo: grupoNome,
        localizacao: propriedadeNome,
        id_propriedade: createDto.id_propriedade,
        motivo: createDto.ocorrencia!,
        nicho: NichoAlerta.CLINICO,
        data_alerta: createDto.dt_ordenha,
        prioridade: prioridadeClassificada,
        observacao: `Ocorrência registrada durante a ordenha do dia ${createDto.dt_ordenha}. Prioridade classificada automaticamente pela IA.`,
      };

      await this.alertasService.create(alertaDto);

      this.customLogger.log('Alerta criado com sucesso', {
        module: 'ControleLeiteiroService',
        method: 'processarAlertaOcorrencia',
        bufalaId: createDto.id_bufala,
        prioridade: prioridadeClassificada,
      });
    } catch (error) {
      this.customLogger.logError(error, {
        module: 'ControleLeiteiroService',
        method: 'processarAlertaOcorrencia',
        bufalaId: createDto.id_bufala,
      });
      throw error;
    }
  }

  /**
   * Lista todos os registros de lactação (sem limitação de usuário).
   */
  async findAll(page = 1, limit = 20) {
    this.customLogger.log('Iniciando busca de todos os registros de lactação', {
      module: 'ControleLeiteiroService',
      method: 'findAll',
      page,
      limit,
    });

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    try {
      const { data, error, count } = await this.supabase
        .from('dadoslactacao')
        .select(
          `
          *,
          bufalo:id_bufala(
            id_bufalo,
            nome,
            brinco,
            grupo:id_grupo(nome_grupo),
            raca:id_raca(nome)
          )
        `,
          { count: 'exact' },
        )
        .order('dt_ordenha', { ascending: false })
        .range(from, to);

      if (error) {
        this.customLogger.logError(error, {
          module: 'ControleLeiteiroService',
          method: 'findAll',
          page,
          limit,
        });
        throw new InternalServerErrorException(`Erro ao buscar dados de lactação: ${error.message}`);
      }

      this.customLogger.log(`Busca de registros de lactação concluída - ${data.length} registros encontrados`, {
        module: 'ControleLeiteiroService',
        method: 'findAll',
        page,
        limit,
        total: count ?? data.length,
      });

      return {
        message: 'Dados de lactação recuperados com sucesso',
        total: count ?? data.length,
        page,
        limit,
        dados: formatDateFieldsArray(data),
      };
    } catch (error) {
      this.customLogger.logError(error, {
        module: 'ControleLeiteiroService',
        method: 'findAll',
        page,
        limit,
      });
      throw error;
    }
  }
  // MÉTODO CORRIGIDO ABAIXO
  /**
   * Lista todos os registros de lactação de uma búfala específica.
   * A autorização é baseada na propriedade do animal, não no criador do registro.
   */
  async findAllByBufala(id_bufala: string, page = 1, limit = 20, user: any) {
    this.customLogger.log('Iniciando busca de registros de lactação por búfala', {
      module: 'ControleLeiteiroService',
      method: 'findAllByBufala',
      bufalaId: id_bufala,
      page,
      limit,
    });
    const idUsuario = await this.getUserId(user);

    // Etapa 1: Verificar se a búfala existe e se o usuário tem permissão para vê-la.
    // Buscamos a búfala e a propriedade associada para verificar o dono (id_dono).
    const { data: bufalaData, error: bufalaError } = await this.supabase
      .from('bufalo')
      .select('id_bufalo, id_propriedade, propriedade:id_propriedade(id_dono)')
      .eq('id_bufalo', id_bufala)
      .single();

    if (bufalaError || !bufalaData) {
      this.customLogger.warn('Búfala não encontrada', {
        module: 'ControleLeiteiroService',
        method: 'findAllByBufala',
        bufalaId: id_bufala,
        error: bufalaError?.message,
      });
      throw new NotFoundException(`Búfala com ID ${id_bufala} não encontrada.`);
    }

    // Acessando o id_dono através da relação aninhada.
    const idDonoPropriedade = (bufalaData.propriedade as any)?.id_dono;

    // Se a propriedade não tiver dono ou o dono for diferente do usuário logado, negamos o acesso.
    // (Esta regra pode ser expandida para incluir funcionários da propriedade no futuro).
    if (!idDonoPropriedade || idDonoPropriedade !== idUsuario) {
      this.customLogger.warn('Acesso negado - usuário não tem permissão para acessar dados da búfala', {
        module: 'ControleLeiteiroService',
        method: 'findAllByBufala',
        bufalaId: id_bufala,
        userId: String(idUsuario),
        idDonoPropriedade,
      });
      throw new UnauthorizedException(`Você não tem permissão para acessar os dados desta búfala.`);
    }

    // Etapa 2: Buscar os registros de lactação paginados, agora sem filtrar pelo id_usuario.
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    try {
      const { data, error, count } = await this.supabase
        .from('dadoslactacao')
        .select(
          `
          *,
          bufalo:id_bufala(
            id_bufalo,
            nome,
            brinco
          ),
          usuario:id_usuario(
            id_usuario,
            nome
          )
        `,
          { count: 'exact' },
        )
        .eq('id_bufala', id_bufala) // <-- A única condição de filtro necessária aqui
        .order('dt_ordenha', { ascending: false })
        .range(from, to);

      if (error) {
        this.customLogger.logError(error, {
          module: 'ControleLeiteiroService',
          method: 'findAllByBufala',
          bufalaId: id_bufala,
          page,
          limit,
        });
        throw new InternalServerErrorException(`Erro ao buscar dados de lactação: ${error.message}`);
      }

      this.customLogger.log(`Busca de registros por búfala concluída - ${data.length} registros encontrados`, {
        module: 'ControleLeiteiroService',
        method: 'findAllByBufala',
        bufalaId: id_bufala,
        page,
        limit,
        total: count ?? data.length,
      });

      return {
        message: `Dados de lactação da búfala ${id_bufala} recuperados com sucesso`,
        total: count ?? data.length,
        page,
        limit,
        dados: formatDateFieldsArray(data),
      };
    } catch (error) {
      this.customLogger.logError(error, {
        module: 'ControleLeiteiroService',
        method: 'findAllByBufala',
        bufalaId: id_bufala,
        page,
        limit,
      });
      throw error;
    }
  }

  /**
   * Busca um registro de lactação específico, garantindo que ele pertença ao usuário logado.
   */
  async findOne(id: string, user: any) {
    this.customLogger.log('Iniciando busca de registro de lactação por ID', {
      module: 'ControleLeiteiroService',
      method: 'findOne',
      lactacaoId: id,
    });

    const idUsuario = await this.getUserId(user);

    const { data, error } = await this.supabase.from('dadoslactacao').select('*').eq('id_lact', id).eq('id_usuario', idUsuario).single();

    if (error || !data) {
      this.customLogger.warn('Registro de lactação não encontrado ou não pertence ao usuário', {
        module: 'ControleLeiteiroService',
        method: 'findOne',
        lactacaoId: id,
        userId: String(idUsuario),
      });
      throw new NotFoundException(`Registro de lactação com ID ${id} não encontrado ou não pertence a este usuário.`);
    }

    this.customLogger.log('Registro de lactação encontrado com sucesso', {
      module: 'ControleLeiteiroService',
      method: 'findOne',
      lactacaoId: id,
      userId: String(idUsuario),
    });
    return formatDateFields(data);
  }

  /**
   * Atualiza um registro de lactação, verificando a posse antes da operação.
   */
  async update(id: string, updateDto: UpdateDadosLactacaoDto, user: any) {
    this.customLogger.log('Iniciando atualização de registro de lactação', {
      module: 'ControleLeiteiroService',
      method: 'update',
      lactacaoId: id,
    });

    await this.findOne(id, user);

    const { data, error } = await this.supabase.from('dadoslactacao').update(updateDto).eq('id_lact', id).select().single();

    if (error) {
      this.customLogger.logError(error, {
        module: 'ControleLeiteiroService',
        method: 'update',
        lactacaoId: id,
      });
      throw new InternalServerErrorException('Falha ao atualizar o dado de lactação.');
    }

    this.customLogger.log('Registro de lactação atualizado com sucesso', {
      module: 'ControleLeiteiroService',
      method: 'update',
      lactacaoId: id,
    });
    return formatDateFields(data);
  }

  /**
   * Remove um registro de lactação, verificando a posse antes de deletar.
   */
  async remove(id: string, user: any) {
    this.customLogger.log('Iniciando remoção de registro de lactação', {
      module: 'ControleLeiteiroService',
      method: 'remove',
      lactacaoId: id,
    });

    await this.findOne(id, user);

    const { error } = await this.supabase.from('dadoslactacao').delete().eq('id_lact', id);

    if (error) {
      this.customLogger.logError(error, {
        module: 'ControleLeiteiroService',
        method: 'remove',
        lactacaoId: id,
      });
      throw new InternalServerErrorException('Falha ao remover o dado de lactação.');
    }

    this.customLogger.log('Registro de lactação removido com sucesso', {
      module: 'ControleLeiteiroService',
      method: 'remove',
      lactacaoId: id,
    });
    return;
  }

  /**
   * Lista todos os registros de ordenha de um ciclo de lactação específico.
   * Verifica se o usuário tem permissão para acessar o ciclo através da propriedade.
   */
  async findAllByCiclo(id_ciclo_lactacao: string, page = 1, limit = 20, user: any) {
    this.customLogger.log('Iniciando busca de registros de ordenha por ciclo', {
      module: 'ControleLeiteiroService',
      method: 'findAllByCiclo',
      cicloId: id_ciclo_lactacao,
      page,
      limit,
    });

    const idUsuario = await this.getUserId(user);

    // Verificar se o ciclo existe e se o usuário tem permissão
    const { data: cicloData, error: cicloError } = await this.supabase
      .from('ciclolactacao')
      .select('id_ciclo_lactacao, id_propriedade, propriedade:id_propriedade(id_dono)')
      .eq('id_ciclo_lactacao', id_ciclo_lactacao)
      .single();

    if (cicloError || !cicloData) {
      this.customLogger.logError(cicloError, {
        module: 'ControleLeiteiroService',
        method: 'findAllByCiclo',
        cicloId: id_ciclo_lactacao,
      });
      throw new NotFoundException('Ciclo de lactação não encontrado.');
    }

    const idDonoPropriedade = (cicloData.propriedade as any)?.id_dono;

    if (!idDonoPropriedade || idDonoPropriedade !== idUsuario) {
      this.customLogger.log('Usuário não autorizado a acessar este ciclo', {
        module: 'ControleLeiteiroService',
        method: 'findAllByCiclo',
        userId: String(idUsuario),
        idDonoPropriedade: String(idDonoPropriedade),
      });
      throw new ForbiddenException('Você não tem permissão para acessar os dados deste ciclo de lactação.');
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    try {
      // Contar total de registros
      const { count, error: countError } = await this.supabase
        .from('dadoslactacao')
        .select('*', { count: 'exact', head: true })
        .eq('id_ciclo_lactacao', id_ciclo_lactacao);

      if (countError) {
        this.customLogger.logError(countError, {
          module: 'ControleLeiteiroService',
          method: 'findAllByCiclo',
          step: 'count',
        });
        throw new InternalServerErrorException('Erro ao contar registros de ordenha.');
      }

      // Buscar registros paginados
      const { data, error } = await this.supabase
        .from('dadoslactacao')
        .select('*')
        .eq('id_ciclo_lactacao', id_ciclo_lactacao)
        .order('dt_ordenha', { ascending: false })
        .order('periodo', { ascending: true })
        .range(from, to);

      if (error) {
        this.customLogger.logError(error, {
          module: 'ControleLeiteiroService',
          method: 'findAllByCiclo',
          step: 'fetch',
        });
        throw new InternalServerErrorException('Erro ao buscar registros de ordenha do ciclo.');
      }

      this.customLogger.log('Registros de ordenha do ciclo encontrados com sucesso', {
        module: 'ControleLeiteiroService',
        method: 'findAllByCiclo',
        cicloId: id_ciclo_lactacao,
        totalRegistros: count,
        registrosRetornados: data.length,
      });

      return {
        data: formatDateFieldsArray(data),
        pagination: {
          total: count || 0,
          page,
          limit,
          totalPages: Math.ceil((count || 0) / limit),
        },
      };
    } catch (error) {
      if (error instanceof ForbiddenException || error instanceof NotFoundException || error instanceof InternalServerErrorException) {
        throw error;
      }
      this.customLogger.logError(error, {
        module: 'ControleLeiteiroService',
        method: 'findAllByCiclo',
      });
      throw new InternalServerErrorException('Erro inesperado ao buscar registros de ordenha do ciclo.');
    }
  }

  /**
   * Busca fêmeas em lactação de uma propriedade
   */
  async findFemeasEmLactacao(id_propriedade: string): Promise<FemeaEmLactacaoDto[]> {
    this.customLogger.log('Buscando fêmeas em lactação', {
      module: 'ControleLeiteiroService',
      method: 'findFemeasEmLactacao',
      propriedadeId: id_propriedade,
    });

    // 1. Buscar ciclos ativos (status = 'Em Lactação')
    const { data: ciclosAtivos, error: ciclosError } = await this.supabase
      .from('ciclolactacao')
      .select(
        `
        id_ciclo_lactacao,
        id_bufala,
        dt_parto,
        dt_secagem_prevista,
        status,
        bufala:id_bufala(
          id_bufalo,
          nome,
          brinco,
          dt_nascimento,
          id_raca
        )
      `,
      )
      .eq('id_propriedade', id_propriedade)
      .eq('status', 'Em Lactação')
      .order('dt_parto', { ascending: false });

    if (ciclosError) {
      this.customLogger.logError(ciclosError, {
        module: 'ControleLeiteiroService',
        method: 'findFemeasEmLactacao',
      });
      throw new InternalServerErrorException(`Erro ao buscar ciclos de lactação: ${ciclosError.message}`);
    }

    if (!ciclosAtivos || ciclosAtivos.length === 0) {
      return [];
    }

    const resultado: FemeaEmLactacaoDto[] = [];

    for (const ciclo of ciclosAtivos) {
      const bufala = Array.isArray(ciclo.bufala) ? ciclo.bufala[0] : ciclo.bufala;
      if (!bufala) continue;

      // 2. Calcular dias em lactação
      const diasEmLactacao = Math.floor((new Date().getTime() - new Date(ciclo.dt_parto).getTime()) / (1000 * 60 * 60 * 24));

      // 3. Buscar estatísticas de produção do ciclo
      const { data: lactacoes } = await this.supabase
        .from('dadoslactacao')
        .select('qt_ordenha, dt_ordenha, periodo')
        .eq('id_bufala', bufala.id_bufalo)
        .gte('dt_ordenha', ciclo.dt_parto)
        .order('dt_ordenha', { ascending: false });

      const totalProduzido = lactacoes?.reduce((sum, l) => sum + (l.qt_ordenha || 0), 0) || 0;
      const mediaDiaria = diasEmLactacao > 0 ? totalProduzido / diasEmLactacao : 0;
      const ultimaOrdenha = lactacoes?.[0] || null;

      // 4. Buscar raça
      let nomeRaca = 'Sem raça definida';
      if (bufala.id_raca) {
        const { data: raca } = await this.supabase.from('raca').select('nome').eq('id_raca', bufala.id_raca).single();
        if (raca) nomeRaca = raca.nome;
      }

      // 5. Calcular idade em meses
      const idadeMeses = bufala.dt_nascimento
        ? Math.floor((new Date().getTime() - new Date(bufala.dt_nascimento).getTime()) / (1000 * 60 * 60 * 24 * 30.44))
        : 0;

      // 6. Contar número do ciclo
      const { count } = await this.supabase.from('ciclolactacao').select('*', { count: 'exact', head: true }).eq('id_bufala', bufala.id_bufalo);

      resultado.push({
        id_bufalo: bufala.id_bufalo,
        nome: bufala.nome,
        brinco: bufala.brinco || 'Sem brinco',
        idade_meses: idadeMeses,
        raca: nomeRaca,
        classificacao: '', // Será calculado após obter a média do rebanho
        ciclo_atual: {
          id_ciclo_lactacao: ciclo.id_ciclo_lactacao,
          numero_ciclo: count || 0,
          dt_parto: ciclo.dt_parto,
          dias_em_lactacao: diasEmLactacao,
          dt_secagem_prevista: ciclo.dt_secagem_prevista,
          status: ciclo.status,
        },
        producao_atual: {
          total_produzido: parseFloat(totalProduzido.toFixed(2)),
          media_diaria: parseFloat(mediaDiaria.toFixed(2)),
          ultima_ordenha: ultimaOrdenha
            ? {
                data: ultimaOrdenha.dt_ordenha,
                quantidade: ultimaOrdenha.qt_ordenha,
                periodo: ultimaOrdenha.periodo,
              }
            : null,
        },
      });
    }

    // 7. Calcular média do rebanho e classificar
    const mediaRebanho = resultado.length > 0 ? resultado.reduce((sum, f) => sum + f.producao_atual.total_produzido, 0) / resultado.length : 0;

    // 8. Atribuir classificação baseada na média do rebanho
    resultado.forEach((femea) => {
      const totalProduzido = femea.producao_atual.total_produzido;
      femea.classificacao =
        totalProduzido >= mediaRebanho * 1.2
          ? 'Ótima'
          : totalProduzido >= mediaRebanho
            ? 'Boa'
            : totalProduzido >= mediaRebanho * 0.8
              ? 'Mediana'
              : 'Ruim';
    });

    this.customLogger.log(`${resultado.length} fêmeas em lactação encontradas`, {
      module: 'ControleLeiteiroService',
      method: 'findFemeasEmLactacao',
      mediaRebanho: mediaRebanho.toFixed(2),
    });

    return resultado;
  }

  /**
   * Busca resumo de produção de uma búfala
   */
  async getResumoProducaoBufala(id_bufala: string, user: any): Promise<ResumoProducaoBufalaDto> {
    this.customLogger.log('Buscando resumo de produção da búfala', {
      module: 'ControleLeiteiroService',
      method: 'getResumoProducaoBufala',
      bufalaId: id_bufala,
    });

    // 1. Buscar dados da búfala
    const { data: bufala, error: bufalaError } = await this.supabase
      .from('bufalo')
      .select('id_bufalo, nome, brinco')
      .eq('id_bufalo', id_bufala)
      .single();

    if (bufalaError || !bufala) {
      throw new NotFoundException(`Búfala com ID ${id_bufala} não encontrada.`);
    }

    // 2. Buscar ciclo atual (ativo)
    const { data: cicloAtual } = await this.supabase
      .from('ciclolactacao')
      .select('*')
      .eq('id_bufala', id_bufala)
      .eq('status', 'Em Lactação')
      .single();

    let cicloAtualProcessado: any = null;

    if (cicloAtual) {
      const diasEmLactacao = Math.floor((new Date().getTime() - new Date(cicloAtual.dt_parto).getTime()) / (1000 * 60 * 60 * 24));

      // CORREÇÃO: Buscar ordenhas do ciclo atual usando id_ciclo_lactacao
      const { data: ordenhasCiclo } = await this.supabase
        .from('dadoslactacao')
        .select('qt_ordenha, dt_ordenha, periodo')
        .eq('id_ciclo_lactacao', cicloAtual.id_ciclo_lactacao) // <-- MUDANÇA AQUI
        .order('dt_ordenha', { ascending: false });

      const totalProduzido = ordenhasCiclo?.reduce((sum, o) => sum + (o.qt_ordenha || 0), 0) || 0;
      const mediaDiaria = diasEmLactacao > 0 ? totalProduzido / diasEmLactacao : 0;
      const ultimaOrdenha = ordenhasCiclo?.[0] || null;

      // Contar número do ciclo
      const { count } = await this.supabase
        .from('ciclolactacao')
        .select('*', { count: 'exact', head: true })
        .eq('id_bufala', id_bufala)
        .lte('dt_parto', cicloAtual.dt_parto);

      cicloAtualProcessado = {
        id_ciclo_lactacao: cicloAtual.id_ciclo_lactacao,
        numero_ciclo: count || 1,
        dt_parto: cicloAtual.dt_parto,
        dias_em_lactacao: diasEmLactacao,
        total_produzido: parseFloat(totalProduzido.toFixed(2)),
        media_diaria: parseFloat(mediaDiaria.toFixed(2)),
        dt_secagem_prevista: cicloAtual.dt_secagem_prevista,
        ultima_ordenha: ultimaOrdenha
          ? {
              data: ultimaOrdenha.dt_ordenha,
              quantidade: ultimaOrdenha.qt_ordenha,
              periodo: ultimaOrdenha.periodo,
            }
          : null,
      };
    }

    // 3. Buscar ciclos anteriores finalizados - CORREÇÃO: Ordem crescente
    const { data: ciclosAnteriores } = await this.supabase
      .from('ciclolactacao')
      .select('*')
      .eq('id_bufala', id_bufala)
      .eq('status', 'Seca')
      .order('dt_parto', { ascending: true }); // <-- MUDANÇA: true para ordem crescente

    const comparativoCiclos: any[] = [];

    if (ciclosAnteriores) {
      for (const ciclo of ciclosAnteriores) {
        const dtParto = new Date(ciclo.dt_parto);
        const dtSecagem = ciclo.dt_secagem_real ? new Date(ciclo.dt_secagem_real) : null;
        const duracaoDias = dtSecagem ? Math.floor((dtSecagem.getTime() - dtParto.getTime()) / (1000 * 60 * 60 * 24)) : 0;

        // CORREÇÃO: Buscar produção usando id_ciclo_lactacao
        const { data: ordenhas } = await this.supabase.from('dadoslactacao').select('qt_ordenha').eq('id_ciclo_lactacao', ciclo.id_ciclo_lactacao); // <-- MUDANÇA AQUI

        const totalProduzido = ordenhas?.reduce((sum, o) => sum + (o.qt_ordenha || 0), 0) || 0;
        const mediaDiaria = duracaoDias > 0 ? totalProduzido / duracaoDias : 0;

        const { count } = await this.supabase
          .from('ciclolactacao')
          .select('*', { count: 'exact', head: true })
          .eq('id_bufala', id_bufala)
          .lte('dt_parto', ciclo.dt_parto);

        comparativoCiclos.push({
          numero_ciclo: count || 0,
          dt_parto: ciclo.dt_parto,
          dt_secagem: ciclo.dt_secagem_real,
          total_produzido: parseFloat(totalProduzido.toFixed(2)),
          media_diaria: parseFloat(mediaDiaria.toFixed(2)),
          duracao_dias: duracaoDias,
        });
      }
    }

    // 4. Gráfico de produção (últimos 30 dias) - usando id_bufala
    const dataInicio = new Date();
    dataInicio.setDate(dataInicio.getDate() - 30);

    const { data: ordenhasRecentes } = await this.supabase
      .from('dadoslactacao')
      .select('dt_ordenha, qt_ordenha')
      .eq('id_bufala', id_bufala)
      .gte('dt_ordenha', dataInicio.toISOString().split('T')[0])
      .order('dt_ordenha', { ascending: true });

    // Agrupar por data
    const producaoPorDia = new Map<string, number>();
    ordenhasRecentes?.forEach((ordenha) => {
      const data = ordenha.dt_ordenha.split('T')[0];
      const atual = producaoPorDia.get(data) || 0;
      producaoPorDia.set(data, atual + (ordenha.qt_ordenha || 0));
    });

    const graficoProducao = Array.from(producaoPorDia.entries())
      .map(([data, quantidade]) => ({
        data,
        quantidade: parseFloat(quantidade.toFixed(2)),
      }))
      .sort((a, b) => a.data.localeCompare(b.data)); // <-- Garantir ordem cronológica

    return {
      bufala: {
        id: bufala.id_bufalo,
        nome: bufala.nome,
        brinco: bufala.brinco || 'Sem brinco',
      },
      ciclo_atual: formatDateFields(cicloAtualProcessado),
      comparativo_ciclos: formatDateFieldsArray(comparativoCiclos),
      grafico_producao: graficoProducao,
    };
  }
}
