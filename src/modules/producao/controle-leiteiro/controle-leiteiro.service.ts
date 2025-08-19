import { Injectable, NotFoundException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from '../../../core/supabase/supabase.service';
import { CreateDadosLactacaoDto } from './dto/create-dados-lactacao.dto';
import { UpdateDadosLactacaoDto } from './dto/update-dados-lactacao.dto';

@Injectable()
export class ControleLeiteiroService {
  private supabase: SupabaseClient;

  constructor(private readonly supabaseService: SupabaseService) {
    this.supabase = this.supabaseService.getClient();
  }

  /**
   * Método privado para obter o ID numérico do usuário a partir do token.
   */
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
   * Cria um registro de lactação, associando-o ao usuário autenticado.
   */
  async create(createDto: CreateDadosLactacaoDto, user: any) {
    const idUsuario = await this.getUserId(user);

    // Garante que o registro seja sempre do usuário logado, ignorando o id_usuario do DTO se houver
    const dtoToInsert = { ...createDto, id_usuario: idUsuario };

    const { data, error } = await this.supabase
      .from('DadosLactacao')
      .insert(dtoToInsert)
      .select()
      .single();

    if (error) {
      // Checa erro de chave estrangeira para a búfala
      if (error.code === '23503') {
        throw new BadRequestException(`A búfala com id ${createDto.id_bufala} não foi encontrada.`);
      }
      console.error('Erro ao criar dado de lactação:', error);
      throw new InternalServerErrorException('Falha ao criar o dado de lactação.');
    }
    return data;
  }

  /**
   * Lista todos os registros de lactação que pertencem ao usuário autenticado.
   */
  async findAll(user: any) {
    const idUsuario = await this.getUserId(user);

    const { data, error } = await this.supabase
      .from('DadosLactacao')
      .select('*')
      .eq('id_usuario', idUsuario)
      .order('dt_ordenha', { ascending: false });

    if (error) {
      throw new InternalServerErrorException('Falha ao buscar os dados de lactação.');
    }
    return data;
  }

  /**
   * Busca um registro de lactação específico, garantindo que ele pertença ao usuário logado.
   */
  async findOne(id: number, user: any) {
    const idUsuario = await this.getUserId(user);

    const { data, error } = await this.supabase
      .from('DadosLactacao')
      .select('*')
      .eq('id_lact', id)
      .eq('id_usuario', idUsuario) // Filtro de segurança
      .single();

    if (error || !data) {
      throw new NotFoundException(`Registro de lactação com ID ${id} não encontrado ou não pertence a este usuário.`);
    }
    return data;
  }

  /**
   * Atualiza um registro de lactação, verificando a posse antes da operação.
   */
  async update(id: number, updateDto: UpdateDadosLactacaoDto, user: any) {
    // Garante que o registro existe e pertence ao usuário antes de atualizar
    await this.findOne(id, user);

    const { data, error } = await this.supabase
      .from('DadosLactacao')
      .update(updateDto)
      .eq('id_lact', id)
      .select()
      .single();

    if (error) {
      throw new InternalServerErrorException('Falha ao atualizar o dado de lactação.');
    }
    return data;
  }

  /**
   * Remove um registro de lactação, verificando a posse antes de deletar.
   */
  async remove(id: number, user: any) {
    // Garante que o registro existe e pertence ao usuário antes de remover
    await this.findOne(id, user);

    const { error } = await this.supabase.from('DadosLactacao').delete().eq('id_lact', id);

    if (error) {
      throw new InternalServerErrorException('Falha ao remover o dado de lactação.');
    }
    // Retorno void para status 204 No Content
    return;
  }
}