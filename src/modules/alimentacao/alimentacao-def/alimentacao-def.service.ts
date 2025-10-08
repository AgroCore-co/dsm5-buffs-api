import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from '../../../core/supabase/supabase.service';
import { CreateAlimentacaoDefDto } from './dto/create-alimentacao-def.dto';
import { UpdateAlimentacaoDefDto } from './dto/update-alimentacao-def.dto';
import { LoggerService } from '../../../core/logger/logger.service';

@Injectable()
export class AlimentacaoDefService {
  private supabase: SupabaseClient;
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly logger: LoggerService,
  ) {
    this.supabase = this.supabaseService.getClient();
  }

  async create(createAlimentacaoDefDto: CreateAlimentacaoDefDto) {
    const { data, error } = await this.supabase.from('alimentacaodef').insert(createAlimentacaoDefDto).select().single();

    if (error) {
      this.logger.logError(error, { module: 'AlimentacaoDef', method: 'create' });
      throw new InternalServerErrorException('Falha ao criar a alimentação definida.');
    }

    return data;
  }

  async findAll() {
    const { data, error } = await this.supabase.from('alimentacaodef').select('*').order('id_aliment_def', { ascending: true });

    if (error) {
      if (error.code === 'PGRST116') {
        return [];
      }
      this.logger.logError(error, { module: 'AlimentacaoDef', method: 'findAll' });
      throw new InternalServerErrorException('Falha ao buscar as alimentações definidas.');
    }
    return data ?? [];
  }

  async findByPropriedade(idPropriedade: string) {
    const { data, error } = await this.supabase
      .from('alimentacaodef')
      .select('*')
      .eq('id_propriedade', idPropriedade)
      .order('tipo_alimentacao', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      this.logger.logError(error, { module: 'AlimentacaoDef', method: 'findByPropriedade', idPropriedade: String(idPropriedade) });
      throw new InternalServerErrorException('Falha ao buscar as alimentações definidas da propriedade.');
    }

    return data;
  }

  async findOne(id_aliment_def: string) {
    const { data, error } = await this.supabase.from('alimentacaodef').select('*').eq('id_aliment_def', id_aliment_def).single();
    if (error) throw new NotFoundException('Definição de alimentação não encontrada.');
    return data;
  }

  async update(id: string, updateAlimentacaoDefDto: UpdateAlimentacaoDefDto) {
    // Primeiro verifica se a alimentação definida existe
    await this.findOne(id);

    const { data, error } = await this.supabase.from('alimentacaodef').update(updateAlimentacaoDefDto).eq('id_aliment_def', id).select().single();

    if (error) {
      this.logger.logError(error, { module: 'AlimentacaoDef', method: 'update', id: String(id) });
      throw new InternalServerErrorException('Falha ao atualizar a alimentação definida.');
    }

    return data;
  }

  async remove(id: string) {
    // Primeiro verifica se a alimentação definida existe
    await this.findOne(id);

    const { error } = await this.supabase.from('alimentacaodef').delete().eq('id_aliment_def', id);

    if (error) {
      this.logger.logError(error, { module: 'AlimentacaoDef', method: 'remove', id: String(id) });
      throw new InternalServerErrorException('Falha ao deletar a alimentação definida.');
    }

    return { message: 'Alimentação definida deletada com sucesso.' };
  }
}
