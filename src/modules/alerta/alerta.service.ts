import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from 'src/core/supabase/supabase.service';
import { CreateAlertaDto } from './dto/create-alerta.dto';
import { SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class AlertasService {
  private supabase: SupabaseClient;
  constructor(private readonly supabaseService: SupabaseService) {
    this.supabase = this.supabaseService.getClient();
  }

  /**
   * Cria um novo alerta no banco de dados.
   * @param createAlertaDto - Os dados para a criação do novo alerta.
   * @returns O objeto do alerta recém-criado.
   */
  async create(createAlertaDto: CreateAlertaDto) {
    try {
      const { data, error } = await this.supabase.from('Alertas').insert(createAlertaDto).select().single();

      if (error) {
        console.error('Erro ao criar alerta:', error.message);
        // Lançar um erro genérico do servidor em caso de falha na inserção.
        throw new InternalServerErrorException(`Falha ao criar o alerta: ${error.message}`);
      }
      return data;
    } catch (error) {
      // Repassar a exceção se já for uma exceção NestJS ou lançar uma nova.
      throw error instanceof InternalServerErrorException ? error : new InternalServerErrorException('Ocorreu um erro inesperado ao criar o alerta.');
    }
  }

  /**
   * Cria um alerta apenas se não existir um alerta com a mesma origem de evento.
   * Isso torna a tarefa (CRON) idempotente.
   * @param createAlertaDto - Os dados para a criação do novo alerta.
   */
  async createIfNotExists(createAlertaDto: CreateAlertaDto) {
    try {
      // Verifica se já existe um alerta com os mesmos critérios
      if (createAlertaDto.tipo_evento_origem && createAlertaDto.id_evento_origem) {
        const { data: existingAlert, error: searchError } = await this.supabase
          .from('Alertas')
          .select('id_alerta')
          .eq('tipo_evento_origem', createAlertaDto.tipo_evento_origem)
          .eq('id_evento_origem', createAlertaDto.id_evento_origem)
          .maybeSingle(); // Perfeito para verificar 0 ou 1 resultado

        if (searchError) {
          console.error('Erro ao verificar alerta existente:', searchError.message);
          throw new InternalServerErrorException(`Erro ao verificar alerta existente: ${searchError.message}`);
        }

        // Se o alerta JÁ EXISTE (independente do status 'visto'), não faz nada.
        if (existingAlert) {
          // console.log(`Alerta para evento ${createAlertaDto.tipo_evento_origem}:${createAlertaDto.id_evento_origem} já existe. Ignorando.`);
          return existingAlert;
        }
      }

      // Se não existe, cria um novo alerta
      return await this.create(createAlertaDto);
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      console.error('Erro inesperado ao criar alerta condicional:', error);
      throw new InternalServerErrorException('Ocorreu um erro inesperado ao verificar/criar o alerta.');
    }
  }

  /**
   * Retorna uma lista de alertas com base nos filtros fornecidos.
   * @param tipo - Filtra os alertas por nicho (ex: 'CLINICO', 'REPRODUCAO').
   * @param antecendencia - Filtra alertas que ocorrerão nos próximos X dias.
   * @param incluirVistos - Se `true`, inclui alertas já marcados como vistos.
   * @returns Um array de alertas, incluindo dados do animal relacionado.
   */
  async findAll(tipo?: string, antecendencia?: number, incluirVistos: boolean = false) {
    try {
      let query = this.supabase.from('Alertas').select(`
        *,
        animal:Bufalo ( id_bufalo, nome, brinco )
      `);

      if (tipo) {
        query = query.eq('nicho', tipo);
      }

      if (!incluirVistos) {
        query = query.eq('visto', false);
      }

      if (antecendencia) {
        const hoje = new Date();
        const dataLimite = new Date();
        dataLimite.setDate(hoje.getDate() + Number(antecendencia));

        query = query.gte('data_alerta', hoje.toISOString().split('T')[0]); // Compara apenas a data
        query = query.lte('data_alerta', dataLimite.toISOString().split('T')[0]);
      }

      // Ordenar por data para mostrar os mais próximos primeiro, depois por prioridade
      query = query.order('data_alerta', { ascending: true }).order('prioridade', { ascending: false }); // Ex: ALTA vem primeiro

      const { data, error } = await query;

      if (error) {
        throw new InternalServerErrorException(`Falha ao buscar os alertas: ${error.message}`);
      }
      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Encontra um alerta específico pela sua chave primária (id_alerta).
   * @param id - O ID UUID do alerta.
   * @returns O objeto do alerta correspondente.
   */
  async findOne(id: string) {
    const { data, error } = await this.supabase.from('Alertas').select('*').eq('id_alerta', id).single();

    if (error) {
      // Erro específico para quando o registro não é encontrado
      if (error.code === 'PGRST116') {
        throw new NotFoundException(`Alerta com ID ${id} não encontrado.`);
      }
      throw new InternalServerErrorException(error.message);
    }
    return data;
  }

  /**
   * Atualiza o status 'visto' de um alerta.
   * @param id - O ID do alerta a ser atualizado.
   * @param visto - O novo status (true para visto, false para não visto).
   * @returns O objeto do alerta com o status atualizado.
   */
  async setVisto(id: string, visto: boolean) {
    // Garante que o alerta existe antes de atualizar
    await this.findOne(id);

    const { data, error } = await this.supabase
      .from('Alertas')
      .update({ visto: visto, updated_at: new Date().toISOString() })
      .eq('id_alerta', id)
      .select()
      .single();

    if (error) {
      // Pode acontecer se o item for deletado entre a verificação e a atualização
      if (error.code === 'PGRST116') {
        throw new NotFoundException(`Alerta com ID ${id} não encontrado para atualização.`);
      }
      throw new InternalServerErrorException(`Falha ao atualizar o status do alerta: ${error.message}`);
    }
    return data;
  }

  /**
   * Remove um alerta do banco de dados.
   * @param id - O ID UUID do alerta a ser removido.
   */
  async remove(id: string) {
    // Garante que o alerta existe antes de deletar
    await this.findOne(id);

    const { error } = await this.supabase.from('Alertas').delete().eq('id_alerta', id);

    if (error) {
      throw new InternalServerErrorException(`Falha ao remover o alerta: ${error.message}`);
    }
    // Retorno void para um status 204 No Content no controller
    return;
  }
}
