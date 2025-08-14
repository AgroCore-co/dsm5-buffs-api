import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from '../../../core/supabase/supabase.service';
import { CreatePropriedadeDto } from './dto/create-propiedade.dto';
import { UpdatePropriedadeDto } from './dto/update-propriedade.dto';

@Injectable()
export class PropriedadeService {
  private supabase: SupabaseClient;

  constructor(private readonly supabaseService: SupabaseService) {
    this.supabase = this.supabaseService.getClient();
  }

  /**
   * Método privado para obter o ID numérico do usuário a partir do token.
   * Reutilizado em vários métodos para evitar repetição de código.
   */
  private async getUserId(user: any): Promise<number> {
    const { data: perfilUsuario, error } = await this.supabase
      .from('Usuario')
      .select('id_usuario')
      .eq('auth_id', user.sub)
      .single();

    if (error || !perfilUsuario) {
      throw new NotFoundException('Perfil de usuário não encontrado.');
    }
    return perfilUsuario.id_usuario;
  }

  async create(createPropriedadeDto: CreatePropriedadeDto, user: any) {
    const idDono = await this.getUserId(user);

    const { data: novaPropriedade, error: propriedadeError } =
      await this.supabase
        .from('Propriedade')
        .insert([{ ...createPropriedadeDto, id_dono: idDono }])
        .select()
        .single();

    if (propriedadeError) {
      if (propriedadeError.code === '23503') {
        throw new BadRequestException(
          `O endereço com id ${createPropriedadeDto.id_endereco} não foi encontrado.`,
        );
      }
      console.error('Erro ao criar propriedade:', propriedadeError);
      throw new InternalServerErrorException('Falha ao criar a propriedade.');
    }

    return novaPropriedade;
  }

  /**
   * Lista todas as propriedades que pertencem ao usuário autenticado.
   */
  async findAll(user: any) {
    const idDono = await this.getUserId(user);

    const { data, error } = await this.supabase
      .from('Propriedade')
      .select('*')
      .eq('id_dono', idDono);

    if (error) {
      throw new InternalServerErrorException('Falha ao buscar as propriedades.');
    }

    return data;
  }

  /**
   * Busca uma propriedade específica, garantindo que ela pertença ao usuário logado.
   */
  async findOne(id: number, user: any) {
    const idDono = await this.getUserId(user);

    const { data, error } = await this.supabase
      .from('Propriedade')
      .select('*')
      .eq('id_propriedade', id)
      .eq('id_dono', idDono) // Filtro de segurança chave!
      .single();

    if (error || !data) {
      throw new NotFoundException(
        `Propriedade com ID ${id} não encontrada ou não pertence a este usuário.`,
      );
    }

    return data;
  }

  /**
   * Atualiza uma propriedade, verificando a posse antes de realizar a operação.
   */
  async update(
    id: number,
    updatePropriedadeDto: UpdatePropriedadeDto,
    user: any,
  ) {
    // Garante que o usuário é o dono da propriedade antes de tentar atualizar.
    await this.findOne(id, user);

    const { data, error } = await this.supabase
      .from('Propriedade')
      .update(updatePropriedadeDto)
      .eq('id_propriedade', id)
      .select()
      .single();

    if (error) {
      throw new InternalServerErrorException('Falha ao atualizar a propriedade.');
    }

    return data;
  }

  /**
   * Remove uma propriedade, verificando a posse antes de deletar.
   */
  async remove(id: number, user: any) {
    // Garante que o usuário é o dono da propriedade antes de tentar remover.
    await this.findOne(id, user);

    const { error } = await this.supabase
      .from('Propriedade')
      .delete()
      .eq('id_propriedade', id);

    if (error) {
      throw new InternalServerErrorException('Falha ao remover a propriedade.');
    }

    // Retornar void é a prática padrão para DELETE, resultando em status 204 No Content.
    return;
  }
}
