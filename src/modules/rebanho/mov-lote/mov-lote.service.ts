import { Injectable, NotFoundException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from '../../../core/supabase/supabase.service';
import { CreateMovLoteDto } from './dto/create-mov-lote.dto';
import { UpdateMovLoteDto } from './dto/update-mov-lote.dto';

@Injectable()
export class MovLoteService {
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

  /**
   * Valida apenas se as referências (lotes, grupo) existem no banco.
   */
  private async validateReferences(dto: CreateMovLoteDto | UpdateMovLoteDto): Promise<void> {
    if (dto.id_lote_atual && dto.id_lote_anterior && dto.id_lote_atual === dto.id_lote_anterior) {
      throw new BadRequestException('O lote de origem e destino não podem ser os mesmos.');
    }

    const checkIfExists = async (tableName: string, columnName: string, id: number) => {
      const { data, error } = await this.supabase.from(tableName).select(columnName).eq(columnName, id).single();
      if (error || !data) {
        throw new NotFoundException(`${tableName} com ID ${id} não encontrado.`);
      }
    };
    
    if (dto.id_grupo) await checkIfExists('Grupo', 'id_grupo', dto.id_grupo);
    if (dto.id_lote_atual) await checkIfExists('Lote', 'id_lote', dto.id_lote_atual);
    if (dto.id_lote_anterior) await checkIfExists('Lote', 'id_lote', dto.id_lote_anterior);
  }

  async create(createDto: CreateMovLoteDto, user: any) {
    const userId = await this.getUserId(user);
    await this.validateReferences(createDto);

    // Adiciona o id_usuario ao DTO antes de inserir
    const dtoToInsert = { ...createDto, id_usuario: userId };

    const { data, error } = await this.supabase
      .from('MovLote')
      .insert(dtoToInsert)
      .select()
      .single();

    if (error) {
      throw new InternalServerErrorException(`Falha ao registrar a movimentação: ${error.message}`);
    }
    return data;
  }

  async findAll(user: any) {
    const userId = await this.getUserId(user);

    const { data, error } = await this.supabase
      .from('MovLote')
      .select('*')
      .eq('id_usuario', userId)
      .order('dt_entrada', { ascending: false });

    if (error) {
      throw new InternalServerErrorException('Falha ao buscar as movimentações de lote.');
    }
    return data;
  }

  async findOne(id: number, user: any) {
    const userId = await this.getUserId(user);

    const { data, error } = await this.supabase
      .from('MovLote')
      .select('*')
      .eq('id_movimento', id)
      .eq('id_usuario', userId) // Checagem de posse direta
      .single();

    if (error || !data) {
      throw new NotFoundException(`Movimentação com ID ${id} não encontrada ou não pertence a este usuário.`);
    }
    return data;
  }

  async update(id: number, updateDto: UpdateMovLoteDto, user: any) {
    await this.findOne(id, user); // Garante que a movimentação existe e pertence ao usuário
    await this.validateReferences(updateDto); // Valida as novas referências no DTO

    const { data, error } = await this.supabase
      .from('MovLote')
      .update(updateDto)
      .eq('id_movimento', id)
      .select()
      .single();

    if (error) {
      throw new InternalServerErrorException('Falha ao atualizar a movimentação.');
    }
    return data;
  }

  async remove(id: number, user: any) {
    await this.findOne(id, user); // Garante que a movimentação existe e pertence ao usuário

    const { error } = await this.supabase.from('MovLote').delete().eq('id_movimento', id);

    if (error) {
      throw new InternalServerErrorException('Falha ao remover a movimentação.');
    }
    return;
  }
}