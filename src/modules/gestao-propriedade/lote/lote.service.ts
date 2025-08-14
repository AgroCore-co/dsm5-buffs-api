import { Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from '../../../core/supabase/supabase.service';
import { CreateLoteDto } from './dto/create-lote.dto'; 

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
    const { data, error } = await this.supabase.from('Lote').select('*');

    if (error) {
      throw new Error(error.message);
    }
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
          // O PostGIS converte o GeoJSON recebido para o formato GEOMETRY automaticamente
          geo_mapa: createLoteDto.geo_mapa,
        },
      ])
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }
    return data;
  }
}
