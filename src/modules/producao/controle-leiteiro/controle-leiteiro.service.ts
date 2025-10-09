import { Injectable, NotFoundException, InternalServerErrorException, BadRequestException, Logger, UnauthorizedException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from '../../../core/supabase/supabase.service';
import { LoggerService } from '../../../core/logger/logger.service';
import { CreateDadosLactacaoDto } from './dto/create-dados-lactacao.dto';
import { UpdateDadosLactacaoDto } from './dto/update-dados-lactacao.dto';
import { AlertasService } from '../../alerta/alerta.service';
import { CreateAlertaDto, NichoAlerta, PrioridadeAlerta } from '../../alerta/dto/create-alerta.dto';
import { GeminiService } from '../../../core/gemini/gemini.service';

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

    return lactacaoData;
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

      const { data: bufaloInfo, error: bufaloError } = await this.supabase
        .from('bufalo')
        .select(
          `
          grupo:Grupo ( nome_grupo ),
          propriedade:Propriedade ( nome )
        `,
        )
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
        grupo: (bufaloInfo.grupo as any)?.nome_grupo || 'Não informado',
        localizacao: (bufaloInfo.propriedade as any)?.nome || 'Não informada',
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
        dados: data,
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
      .select('id_bufalo, propriedade:Propriedade(id_dono)')
      .eq('id_bufalo', id_bufala)
      .single();

    if (bufalaError || !bufalaData) {
      this.customLogger.warn('Búfala não encontrada', {
        module: 'ControleLeiteiroService',
        method: 'findAllByBufala',
        bufalaId: id_bufala,
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
        dados: data,
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
    return data;
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
    return data;
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
}
