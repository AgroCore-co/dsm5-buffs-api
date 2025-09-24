import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from '../../../core/supabase/supabase.service';
import { CreateAlimentacaoDefDto } from './dto/create-alimentacao-def.dto';
import { UpdateAlimentacaoDefDto } from './dto/update-alimentacao-def.dto';
import { LoggerService } from '../../../core/logger/logger.service';

@Injectable()
export class AlimentacaoDefService {
  private supabase: SupabaseClient;
  constructor(private readonly supabaseService: SupabaseService, private readonly logger: LoggerService) {
    this.supabase = this.supabaseService.getClient();
  }

  async create(createAlimentacaoDefDto: CreateAlimentacaoDefDto) {
    const { data, error } = await this.supabase.from('AlimentacaoDef').insert(createAlimentacaoDefDto).select().single();

    if (error) {
      this.logger.logError(error, { module: 'AlimentacaoDef', method: 'create' });
      throw new InternalServerErrorException('Falha ao criar a alimentação definida.');
    }

    return data;
  }

  async findAll() {
    const { data, error } = await this.supabase.from('AlimentacaoDef').select('*').order('id_aliment_def', { ascending: true });

    if (error) {
      if (error.code === 'PGRST116') {
        return [];
      }
      this.logger.logError(error, { module: 'AlimentacaoDef', method: 'findAll' });
      throw new InternalServerErrorException('Falha ao buscar as alimentações definidas.');
    }
    return data ?? [];
  }

  async findByPropriedade(idPropriedade: number) {
    const { data, error } = await this.supabase
      .from('AlimentacaoDef')
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

  async findOne(id: number) {
    const { data, error } = await this.supabase.from('AlimentacaoDef').select('*').eq('id_aliment_def', id).single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundException('Alimentação definida não encontrada.');
      }
      this.logger.logError(error, { module: 'AlimentacaoDef', method: 'findOne', id: String(id) });
      throw new InternalServerErrorException('Falha ao buscar a alimentação definida.');
    }

    return data;
  }

  async update(id: number, updateAlimentacaoDefDto: UpdateAlimentacaoDefDto) {
    // Primeiro verifica se a alimentação definida existe
    await this.findOne(id);

    const { data, error } = await this.supabase.from('AlimentacaoDef').update(updateAlimentacaoDefDto).eq('id_aliment_def', id).select().single();

    if (error) {
      this.logger.logError(error, { module: 'AlimentacaoDef', method: 'update', id: String(id) });
      throw new InternalServerErrorException('Falha ao atualizar a alimentação definida.');
    }

    return data;
  }

  async remove(id: number) {
    // Primeiro verifica se a alimentação definida existe
    await this.findOne(id);

    const { error } = await this.supabase.from('AlimentacaoDef').delete().eq('id_aliment_def', id);

    if (error) {
      this.logger.logError(error, { module: 'AlimentacaoDef', method: 'remove', id: String(id) });
      throw new InternalServerErrorException('Falha ao deletar a alimentação definida.');
    }

    return { message: 'Alimentação definida deletada com sucesso.' };
  }
}
