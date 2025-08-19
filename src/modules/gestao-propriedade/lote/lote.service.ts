import { Injectable, InternalServerErrorException, NotFoundException, BadRequestException } from '@nestjs/common';
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

  private async getUserId(user: any): Promise<number> {
    const { data: perfilUsuario, error } = await this.supabase
      .from('Usuario')
      .select('id_usuario')
      .eq('email', user.email)
      .single();

    if (error || !perfilUsuario) {
      throw new NotFoundException('Perfil de usuário não encontrado.');
    }
    return perfilUsuario.id_usuario;
  }

  // Função helper para converter a string GeoJSON em objeto
  private parseGeoMapa(lote: any): any {
    if (lote && typeof lote.geo_mapa === 'string') {
      try {
        lote.geo_mapa = JSON.parse(lote.geo_mapa);
      } catch (e) {
        // Se falhar, deixa como está para não quebrar a aplicação
        console.error('Falha ao parsear GeoJSON:', e);
      }
    }
    return lote;
  }
  
  private async validateOwnership(propriedadeId: number, userId: number) {
      const { data: propriedade, error } = await this.supabase
        .from('Propriedade')
        .select('id_propriedade')
        .eq('id_propriedade', propriedadeId)
        .eq('id_dono', userId)
        .single();
      
      if (error || !propriedade) {
        throw new NotFoundException(`Propriedade com ID ${propriedadeId} não encontrada ou não pertence a este usuário.`);
      }
  }

  async create(createLoteDto: CreateLoteDto, user: any) {
    const userId = await this.getUserId(user);
    await this.validateOwnership(createLoteDto.id_propriedade, userId);
    
    // Prepara o objeto para inserção, stringificando o geo_mapa
    const loteToInsert = {
        ...createLoteDto,
        geo_mapa: JSON.stringify(createLoteDto.geo_mapa)
    };

    const { data, error } = await this.supabase
      .from('Lote')
      .insert(loteToInsert)
      .select()
      .single();

    if (error) {
       if (error.code === '23503') { // Erro de chave estrangeira
        throw new BadRequestException(`A propriedade com ID ${createLoteDto.id_propriedade} não existe.`);
      }
      throw new InternalServerErrorException('Falha ao criar o lote.');
    }
    // Parseia o retorno para o cliente
    return this.parseGeoMapa(data);
  }

  async findAllByPropriedade(id_propriedade: number, user: any) {
    const userId = await this.getUserId(user);
    await this.validateOwnership(id_propriedade, userId);

    const { data, error } = await this.supabase
      .from('Lote')
      .select('*')
      .eq('id_propriedade', id_propriedade)
      .order('created_at', { ascending: false });

    if (error) {
      throw new InternalServerErrorException('Falha ao buscar os lotes da propriedade.');
    }
    // Parseia cada lote da lista
    return data.map(this.parseGeoMapa);
  }

  async findOne(id: number, user: any) {
    const userId = await this.getUserId(user);
    
    const { data, error } = await this.supabase
      .from('Lote')
      .select('*, Propriedade(id_dono)')
      .eq('id_lote', id)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Lote com ID ${id} não encontrado.`);
    }

    if (data.Propriedade?.id_dono !== userId) {
        throw new NotFoundException(`Lote com ID ${id} não encontrado ou não pertence a este usuário.`);
    }
    
    delete (data as any).Propriedade;
    return this.parseGeoMapa(data);
  }

  async update(id: number, updateLoteDto: UpdateLoteDto, user: any) {
    await this.findOne(id, user); // Valida a posse do lote que será atualizado

    // Se o DTO de update contiver um novo geo_mapa, ele precisa ser stringificado
    const loteToUpdate: any = { ...updateLoteDto };
    if (loteToUpdate.geo_mapa) {
        loteToUpdate.geo_mapa = JSON.stringify(loteToUpdate.geo_mapa);
    }
    
    // Se a propriedade estiver sendo alterada, valida a posse da nova propriedade
    if(loteToUpdate.id_propriedade){
        const userId = await this.getUserId(user);
        await this.validateOwnership(loteToUpdate.id_propriedade, userId);
    }

    const { data, error } = await this.supabase
        .from('Lote')
        .update(loteToUpdate)
        .eq('id_lote', id)
        .select()
        .single();

    if (error) {
      throw new InternalServerErrorException('Falha ao atualizar o lote.');
    }
    return this.parseGeoMapa(data);
  }

  async remove(id: number, user: any) {
    await this.findOne(id, user); // Valida posse

    const { error } = await this.supabase.from('Lote').delete().eq('id_lote', id);

    if (error) {
      throw new InternalServerErrorException('Falha ao deletar o lote.');
    }
    return;
  }
}