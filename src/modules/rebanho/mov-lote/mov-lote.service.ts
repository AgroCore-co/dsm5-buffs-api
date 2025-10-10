import { Injectable, NotFoundException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from '../../../core/supabase/supabase.service';
import { CreateMovLoteDto } from './dto/create-mov-lote.dto';
import { UpdateMovLoteDto } from './dto/update-mov-lote.dto';
import { LoggerService } from '../../../core/logger/logger.service';
import { PaginationDto } from '../../../core/dto/pagination.dto';
import { PaginatedResponse } from '../../../core/dto/pagination.dto';
import { createPaginatedResponse, calculatePaginationParams } from '../../../core/utils/pagination.utils';

@Injectable()
export class MovLoteService {
  private readonly logger: LoggerService;
  private supabase: SupabaseClient;

  constructor(
    private readonly supabaseService: SupabaseService,
    logger: LoggerService,
  ) {
    this.supabase = this.supabaseService.getAdminClient();
    this.logger = logger;
  }

  private async getUserId(user: any): Promise<number> {
    const { data: perfilUsuario, error } = await this.supabase.from('usuario').select('id_usuario').eq('email', user.email).single();

    if (error || !perfilUsuario) {
      throw new NotFoundException('Perfil de usuário não encontrado.');
    }
    return perfilUsuario.id_usuario;
  }

  /**
   * Valida apenas se as referências (lotes, grupo) existem no banco.
   */
  private async validateReferences(dto: CreateMovLoteDto | UpdateMovLoteDto): Promise<void> {
    if (dto.id_lote_atual && dto.id_lote_anterior && dto.id_lote_atual === dto.id_lote_anterior) {
      throw new BadRequestException('Lote de origem e destino não podem ser iguais.');
    }

    const checkIfExists = async (tableName: string, columnName: string, id: string) => {
      const { data, error } = await this.supabase.from(tableName).select('id').eq(columnName, id).maybeSingle();
      if (error || !data) throw new NotFoundException(`${tableName} com ID ${id} não encontrado.`);
    };

    if (dto.id_grupo) await checkIfExists('grupo', 'id_grupo', dto.id_grupo);
    if (dto.id_lote_atual) await checkIfExists('lote', 'id_lote', dto.id_lote_atual);
    if (dto.id_lote_anterior) await checkIfExists('lote', 'id_lote', dto.id_lote_anterior);
  }

  async create(createDto: CreateMovLoteDto, user: any) {
    const { id_grupo, id_lote_atual, dt_entrada, motivo } = createDto;
    let { id_lote_anterior } = createDto;

    const id_usuario = await this.getUserId(user);

    // Log inicial da operação
    this.logger.log(
      `[INICIO] Movimentacao fisica iniciada - Usuario: ${id_usuario}, Grupo: ${id_grupo}, Lote destino: ${id_lote_atual}, Data entrada: ${dt_entrada}`,
    );

    try {
      // Validação inicial
      if (id_lote_anterior && id_lote_anterior === id_lote_atual) {
        this.logger.warn(`[VALIDACAO_FALHOU] Tentativa de mover grupo ${id_grupo} para o mesmo lote (${id_lote_atual})`);
        throw new BadRequestException('Lote de origem e destino não podem ser os mesmos.');
      }

      this.logger.debug(`[VALIDACAO] Validando referencias - Grupo: ${id_grupo}, Lote destino: ${id_lote_atual}`);
      await this.validateReferences(createDto);
      this.logger.debug(`[VALIDACAO_OK] Referencias validadas com sucesso`);

      // **PASSO 1: BUSCAR E FINALIZAR REGISTRO ANTERIOR**
      this.logger.debug(`[BUSCA_REGISTRO] Procurando registro ativo atual para o grupo ${id_grupo}`);

      const { data: registroAtual, error: findError } = await this.supabase
        .from('movlote')
        .select(
          `
          *,
          lote_atual:id_lote_atual(nome_lote),
          grupo:id_grupo(nome_grupo)
        `,
        )
        .eq('id_grupo', id_grupo)
        .is('dt_saida', null)
        .maybeSingle();

      if (findError) {
        this.logger.error(`[ERRO_BUSCA] Erro ao buscar registro atual do grupo ${id_grupo}: ${findError.message}`);
        throw new InternalServerErrorException(`Erro ao buscar registro atual: ${findError.message}`);
      }

      let loteAnterior = null;

      if (registroAtual) {
        this.logger.log(
          `[REGISTRO_ENCONTRADO] Grupo ${id_grupo} atualmente no lote "${registroAtual.lote_atual?.nome}" desde ${registroAtual.dt_entrada}`,
        );

        // Validação de data
        if (new Date(dt_entrada) < new Date(registroAtual.dt_entrada)) {
          this.logger.warn(`[DATA_INVALIDA] Data de entrada (${dt_entrada}) anterior ao registro atual (${registroAtual.dt_entrada})`);
          throw new BadRequestException('A data de entrada não pode ser anterior à última movimentação do grupo.');
        }

        // Calcula tempo de permanência no lote anterior
        const diasPermanencia = Math.ceil((new Date(dt_entrada).getTime() - new Date(registroAtual.dt_entrada).getTime()) / (1000 * 60 * 60 * 24));
        this.logger.log(`[PERMANENCIA] Grupo ${id_grupo} permaneceu ${diasPermanencia} dias no lote "${registroAtual.lote_atual?.nome}"`);

        // Finaliza o registro anterior
        this.logger.debug(`[FINALIZANDO_REGISTRO] Fechando registro ${registroAtual.id_movimento} com data de saida: ${dt_entrada}`);

        const { error: updateError } = await this.supabase
          .from('movlote')
          .update({ dt_saida: dt_entrada })
          .eq('id_movimento', registroAtual.id_movimento);

        if (updateError) {
          this.logger.error(`[ERRO_FINALIZACAO] Falha ao fechar registro ${registroAtual.id_movimento}: ${updateError.message}`);
          throw new InternalServerErrorException(`Falha ao fechar registro anterior: ${updateError.message}`);
        }

        this.logger.log(`[REGISTRO_FECHADO] Registro ${registroAtual.id_movimento} finalizado com sucesso`);

        loteAnterior = registroAtual.lote_atual as any;

        // Se o DTO não especificou a origem, usamos a que encontramos no banco
        if (!id_lote_anterior) {
          id_lote_anterior = registroAtual.id_lote_atual;
          this.logger.debug(`[AUTO_DETECCAO] Lote anterior detectado automaticamente: ${id_lote_anterior}`);
        }
      } else {
        this.logger.log(`[PRIMEIRA_MOVIMENTACAO] Esta e a primeira movimentacao registrada para o grupo ${id_grupo}`);
      }

      // **PASSO 2: CRIAR NOVO REGISTRO DE ENTRADA**
      const dtoToInsert = {
        id_grupo,
        id_lote_anterior,
        id_lote_atual,
        id_propriedade: createDto.id_propriedade,
        dt_entrada,
        dt_saida: null,
        id_usuario,
        motivo: motivo || null,
      };

      this.logger.debug(`[CRIANDO_REGISTRO] Inserindo novo registro de movimentacao`, { dtoToInsert });

      const { data: novoRegistro, error: insertError } = await this.supabase
        .from('movlote')
        .insert(dtoToInsert)
        .select(
          `
          *,
          grupo:id_grupo(nome_grupo),
          lote_atual:id_lote_atual(nome),
          lote_anterior:id_lote_anterior(nome),
          usuario:id_usuario(nome)
        `,
        )
        .single();

      if (insertError) {
        this.logger.error(`[ERRO_INSERCAO] Falha ao inserir novo registro: ${insertError.message}`);
        throw new InternalServerErrorException(`Falha ao registrar a nova movimentação: ${insertError.message}`);
      }

      // Log de sucesso detalhado
      this.logger.log(`[SUCESSO] Movimentacao registrada com sucesso - ID: ${novoRegistro.id_movimento}`);
      this.logger.log(
        `[DETALHES_SUCESSO] Grupo: "${(novoRegistro.grupo as any).nome_grupo}" | De: "${(loteAnterior as any)?.nome_lote || 'Primeira movimentação'}" | Para: "${(novoRegistro.lote_atual as any).nome_lote}" | Responsavel: "${(novoRegistro.usuario as any).nome}"`,
      );

      // Log final da operação
      this.logger.log(
        `[FINALIZACAO] Operacao de movimentacao fisica concluida - Usuario: ${id_usuario}, Grupo: ${id_grupo}, Novo lote: ${id_lote_atual}`,
      );

      return {
        message: `Grupo "${(novoRegistro.grupo as any).nome_grupo}" movido com sucesso para o lote "${(novoRegistro.lote_atual as any).nome_lote}".`,
        movimentacao: {
          id: novoRegistro.id_movimento,
          grupo: (novoRegistro.grupo as any).nome_grupo,
          lote_anterior: (loteAnterior as any)?.nome_lote || 'Primeira movimentação',
          lote_atual: (novoRegistro.lote_atual as any).nome_lote,
          dt_entrada: novoRegistro.dt_entrada,
          motivo: novoRegistro.motivo,
          responsavel: (novoRegistro.usuario as any).nome,
          dias_lote_anterior: registroAtual
            ? Math.ceil((new Date(dt_entrada).getTime() - new Date(registroAtual.dt_entrada).getTime()) / (1000 * 60 * 60 * 24))
            : null,
        },
      };
    } catch (error) {
      this.logger.error(
        `[ERRO_GERAL] Falha na movimentacao fisica - Usuario: ${id_usuario}, Grupo: ${id_grupo}, Erro: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async findAll() {
    const { data, error } = await this.supabase
      .from('movlote')
      .select(
        `
        *,
        grupo:id_grupo(nome_grupo),
        lote_atual:id_lote_atual(nome_lote),
        lote_anterior:id_lote_anterior(nome_lote),
        usuario:id_usuario(nome)
      `,
      )
      .order('dt_entrada', { ascending: false });

    if (error) {
      if (error.code === 'PGRST116') {
        return [];
      }
      throw new InternalServerErrorException('Falha ao buscar as movimentações de lote.');
    }
    return data ?? [];
  }

  async findByPropriedade(id_propriedade: string, paginationDto: PaginationDto = {}): Promise<PaginatedResponse<any>> {
    this.logger.log('Iniciando busca de movimentações por propriedade', {
      module: 'MovLoteService',
      method: 'findByPropriedade',
      propriedadeId: id_propriedade,
    });

    const { page = 1, limit = 10 } = paginationDto;
    const { limit: limitValue, offset } = calculatePaginationParams(page, limit);

    const { count, error: countError } = await this.supabase
      .from('movlote')
      .select('*', { count: 'exact', head: true })
      .eq('id_propriedade', id_propriedade);

    if (countError) {
      this.logger.error(`[ERRO] Falha ao contar movimentações da propriedade: ${countError.message}`);
      throw new InternalServerErrorException(`Falha ao contar movimentações da propriedade: ${countError.message}`);
    }

    const { data, error } = await this.supabase
      .from('movlote')
      .select(
        `
        *,
        grupo:id_grupo(nome_grupo),
        lote_atual:id_lote_atual(nome_lote),
        lote_anterior:id_lote_anterior(nome_lote),
        usuario:id_usuario(nome),
        propriedade:Propriedade(nome)
      `,
      )
      .eq('id_propriedade', id_propriedade)
      .order('dt_entrada', { ascending: false })
      .range(offset, offset + limitValue - 1);

    if (error) {
      this.logger.error(`[ERRO] Falha ao buscar movimentações da propriedade: ${error.message}`);
      throw new InternalServerErrorException(`Falha ao buscar movimentações da propriedade: ${error.message}`);
    }

    this.logger.log(`Busca concluída - ${data?.length || 0} movimentações encontradas (página ${page})`, {
      module: 'MovLoteService',
      method: 'findByPropriedade',
    });

    return createPaginatedResponse(data || [], count || 0, page, limitValue);
  }

  async findOne(id: string, user: any) {
    const userId = await this.getUserId(user);

    const { data, error } = await this.supabase
      .from('movlote')
      .select('*')
      .eq('id_movimento', id)
      .eq('id_usuario', userId) // Checagem de posse direta
      .single();

    if (error || !data) {
      throw new NotFoundException(`Movimentação com ID ${id} não encontrada ou não pertence a este usuário.`);
    }
    return data;
  }

  async update(id: string, updateDto: UpdateMovLoteDto, user: any) {
    await this.validateReferences(updateDto);
    await this.findOne(id, user); // Garante que a movimentação existe e pertence ao usuário
    await this.validateReferences(updateDto); // Valida as novas referências no DTO

    const { data, error } = await this.supabase.from('movlote').update(updateDto).eq('id_movimento', id).select().single();

    if (error) {
      throw new InternalServerErrorException('Falha ao atualizar a movimentação.');
    }
    return data;
  }

  async remove(id: string, user: any) {
    await this.findOne(id, user); // Garante que a movimentação existe e pertence ao usuário

    const { error } = await this.supabase.from('movlote').delete().eq('id_movimento', id);

    if (error) {
      throw new InternalServerErrorException('Falha ao remover a movimentação.');
    }
    return;
  }

  async findHistoricoByGrupo(id_grupo: string) {
    const { data, error } = await this.supabase
      .from('movlote')
      .select(
        `
        *,
        grupo:id_grupo(nome_grupo),
        lote_atual:id_lote_atual(nome_lote),
        lote_anterior:id_lote_anterior(nome_lote),
        usuario:id_usuario(nome)
      `,
      )
      .eq('id_grupo', id_grupo)
      .order('dt_entrada', { ascending: false });

    if (error) {
      throw new InternalServerErrorException(`Falha ao buscar histórico: ${error.message}`);
    }

    return {
      grupo_id: id_grupo,
      grupo_nome: data[0]?.grupo?.nome_grupo || 'Desconhecido',
      total_movimentacoes: data.length,
      historico: data.map((mov) => ({
        id_movimento: mov.id_movimento,
        lote_anterior: mov.lote_anterior?.nome_lote || 'Primeira movimentação',
        lote_atual: mov.lote_atual.nome_lote,
        dt_entrada: mov.dt_entrada,
        dt_saida: mov.dt_saida,
        dias_permanencia: mov.dt_saida
          ? Math.ceil((new Date(mov.dt_saida).getTime() - new Date(mov.dt_entrada).getTime()) / (1000 * 60 * 60 * 24))
          : Math.ceil((new Date().getTime() - new Date(mov.dt_entrada).getTime()) / (1000 * 60 * 60 * 24)),
        status: mov.dt_saida ? 'Finalizado' : 'Atual',
        motivo: mov.motivo,
        responsavel: mov.usuario.nome,
      })),
    };
  }

  async findStatusAtual(id_grupo: string) {
    const { data, error } = await this.supabase
      .from('movlote')
      .select(
        `
        *,
        grupo:id_grupo(nome_grupo),
        lote_atual:id_lote_atual(nome_lote),
        usuario:id_usuario(nome)
      `,
      )
      .eq('id_grupo', id_grupo)
      .is('dt_saida', null)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundException(`Grupo ${id_grupo} não possui movimentações registradas.`);
      }
      throw new InternalServerErrorException(`Falha ao buscar status atual: ${error.message}`);
    }

    const diasNoLocal = Math.ceil((new Date().getTime() - new Date(data.dt_entrada).getTime()) / (1000 * 60 * 60 * 24));

    return {
      grupo: {
        id: id_grupo,
        nome: data.grupo.nome_grupo,
      },
      localizacao_atual: {
        lote: data.lote_atual.nome_lote,
        desde: data.dt_entrada,
        dias_no_local: diasNoLocal,
        motivo_chegada: data.motivo,
      },
      responsavel_movimentacao: data.usuario.nome,
    };
  }
}
