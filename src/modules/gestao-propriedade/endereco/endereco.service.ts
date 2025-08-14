import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from '../../../core/supabase/supabase.service';
import { CreateEnderecoDto } from './dto/create-endereco.dto';

@Injectable()
export class EnderecoService {
  private supabase: SupabaseClient;

  constructor(private readonly supabaseService: SupabaseService) {
    this.supabase = this.supabaseService.getClient();
  }

  async create(createEnderecoDto: CreateEnderecoDto) {
    const { data, error } = await this.supabase
      .from('Endereco')
      .insert(createEnderecoDto)
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar endereço:', error);
      throw new InternalServerErrorException('Falha ao criar o endereço.');
    }

    return data;
  }

  // Futuramente, você pode adicionar aqui os métodos findAll, findOne, update, remove
}
