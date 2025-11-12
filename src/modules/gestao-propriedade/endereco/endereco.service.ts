import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from '../../../core/supabase/supabase.service';
import { LoggerService } from '../../../core/logger/logger.service';
import { CreateEnderecoDto } from './dto/create-endereco.dto';
import { UpdateEnderecoDto } from './dto/update-endereco.dto';
import { formatDateFields, formatDateFieldsArray } from '../../../core/utils/date-formatter.utils';

@Injectable()
export class EnderecoService {
  private supabase: SupabaseClient;

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly logger: LoggerService,
  ) {
    this.supabase = this.supabaseService.getAdminClient();
  }

  async create(createEnderecoDto: CreateEnderecoDto) {
    const { data, error } = await this.supabase.from('endereco').insert(createEnderecoDto).select().single();

    if (error) {
      this.logger.logError(error, { module: 'Endereco', method: 'create' });
      throw new InternalServerErrorException('Falha ao criar o endereço.');
    }

    return formatDateFields(data);
  }

  async findAll() {
    const { data, error } = await this.supabase.from('endereco').select('*').order('created_at', { ascending: false });

    if (error) {
      this.logger.logError(error, { module: 'Endereco', method: 'findAll' });
      throw new InternalServerErrorException('Falha ao buscar os endereços.');
    }

    return formatDateFieldsArray(data);
  }

  async findOne(id: string) {
    const { data, error } = await this.supabase.from('endereco').select('*').eq('id_endereco', id).single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundException('Endereço não encontrado.');
      }
      this.logger.logError(error, { module: 'Endereco', method: 'findOne', id });
      throw new InternalServerErrorException('Falha ao buscar o endereço.');
    }

    return formatDateFields(data);
  }

  async update(id: string, updateEnderecoDto: UpdateEnderecoDto) {
    // Primeiro verifica se o endereço existe
    await this.findOne(id);

    const { data, error } = await this.supabase
      .from('endereco')
      .update({
        ...updateEnderecoDto,
        updated_at: new Date().toISOString(),
      })
      .eq('id_endereco', id)
      .select()
      .single();

    if (error) {
      this.logger.logError(error, { module: 'Endereco', method: 'update', id });
      throw new InternalServerErrorException('Falha ao atualizar o endereço.');
    }

    return formatDateFields(data);
  }

  async remove(id: string) {
    // Primeiro verifica se o endereço existe
    await this.findOne(id);

    const { error } = await this.supabase.from('endereco').delete().eq('id_endereco', id);

    if (error) {
      this.logger.logError(error, { module: 'Endereco', method: 'remove', id });
      throw new InternalServerErrorException('Falha ao deletar o endereço.');
    }

    return { message: 'Endereço deletado com sucesso.' };
  }
}
