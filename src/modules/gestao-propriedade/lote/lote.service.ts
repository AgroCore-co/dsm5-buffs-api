import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from '../../../core/supabase/supabase.service';
import { CreateLoteDto } from './dto/create-lote.dto';
import { UpdateLoteDto } from './dto/update-lote.dto';

@Injectable()
export class LoteService {
  private supabase: SupabaseClient;

  constructor(private readonly supabaseService: SupabaseService) {
    this.supabase = this.supabaseService.getClient();
  }

  /**
   * Busca todos os lotes (piquetes) do banco de dados.
   * O campo 'geo_mapa' será retornado no formato GeoJSON, pronto para o Leaflet.
   */
  async findAll() {
    const { data, error } = await this.supabase.from('Lote').select('*').order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar lotes:', error);
      throw new InternalServerErrorException('Falha ao buscar os lotes.');
    }
    return data;
  }

  /**
   * Busca um lote específico pelo ID.
   */
  async findOne(id: number) {
    const { data, error } = await this.supabase.from('Lote').select('*').eq('id_lote', id).single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundException('Lote não encontrado.');
      }
      console.error('Erro ao buscar lote:', error);
      throw new InternalServerErrorException('Falha ao buscar o lote.');
    }

    return data;
  }
  
  /**
   * Busca todos os lotes (piquetes) de uma propriedade específica.
   * @param id_propriedade - O ID da propriedade para filtrar os lotes.
   */
  async findAllByPropriedade(id_propriedade: number) {
    const { data, error } = await this.supabase
      .from('Lote')
      .select('*')
      .eq('id_propriedade', id_propriedade) // AQUI ESTÁ A OTIMIZAÇÃO
      .order('created_at', { ascending: false });

    if (error) {
      console.error(`Erro ao buscar lotes para a propriedade ${id_propriedade}:`, error);
      throw new InternalServerErrorException('Falha ao buscar os lotes da propriedade.');
    }

    // Se não encontrar lotes, retorna um array vazio, o que é um comportamento esperado.
    return data;
  }

  /**
   * Cria um novo lote no banco de dados.
   * @param createLoteDto - Dados do novo lote, incluindo a geometria.
   */
  async create(createLoteDto: CreateLoteDto) {
    const { data, error } = await this.supabase
      .from('Lote')
      .insert([
        {
          nome_lote: createLoteDto.nome_lote,
          id_propriedade: createLoteDto.id_propriedade,
          descricao: createLoteDto.descricao,
          geo_mapa: JSON.stringify(createLoteDto.geo_mapa),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar lote:', error);
      throw new InternalServerErrorException('Falha ao criar o lote.');
    }
    return data;
  }

  /**
   * Atualiza um lote existente.
   */
  async update(id: number, updateLoteDto: UpdateLoteDto) {
    // Primeiro verifica se o lote existe
    await this.findOne(id);

    const { data, error } = await this.supabase.from('Lote').update(updateLoteDto).eq('id_lote', id).select().single();

    if (error) {
      console.error('Erro ao atualizar lote:', error);
      throw new InternalServerErrorException('Falha ao atualizar o lote.');
    }

    return data;
  }

  /**
   * Remove um lote do sistema.
   */
  async remove(id: number) {
    // Primeiro verifica se o lote existe
    await this.findOne(id);

    const { error } = await this.supabase.from('Lote').delete().eq('id_lote', id);

    if (error) {
      console.error('Erro ao deletar lote:', error);
      throw new InternalServerErrorException('Falha ao deletar o lote.');
    }

    return { message: 'Lote deletado com sucesso.' };
  }
}
