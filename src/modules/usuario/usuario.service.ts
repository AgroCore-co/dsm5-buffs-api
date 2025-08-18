import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from '../../core/supabase/supabase.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';

@Injectable()
export class UsuarioService {
  private supabase: SupabaseClient;

  constructor(private readonly supabaseService: SupabaseService) {
    this.supabase = this.supabaseService.getClient();
  }

  /**
   * Cria um novo perfil de usuário associado a um ID de autenticação.
   * @param createUsuarioDto - Dados para o novo perfil.
   * @param authId - O ID de autenticação (sub) do usuário logado.
   * @returns O perfil do usuário recém-criado.
   */
  async create(createUsuarioDto: CreateUsuarioDto, email: string) {
    // Sem coluna auth_id no schema: utilizamos e-mail para unicidade
    const { data: existingProfile } = await this.supabase.from('Usuario').select('id_usuario').eq('email', email).single();

    if (existingProfile) {
      throw new ConflictException('Este usuário já possui um perfil cadastrado.');
    }

    const { data, error } = await this.supabase
      .from('Usuario')
      .insert([{ ...createUsuarioDto, email }])
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }
    return data;
  }

  /**
   * Retorna uma lista de todos os usuários.
   * @returns Um array de todos os usuários.
   */
  async findAll() {
    const { data, error } = await this.supabase.from('Usuario').select('*');
    if (error) {
      throw new Error(error.message);
    }
    return data;
  }

  /**
   * Encontra um perfil de usuário usando o ID de autenticação do Supabase (o 'sub' do token).
   * @param id - O ID de autenticação (UUID) do usuário.
   * @returns O perfil do usuário correspondente.
   */
  async findOneById(id: string) {
    // Sem auth_id: buscamos por e-mail fornecido pelo token
    const { data, error } = await this.supabase.from('Usuario').select('*').eq('email', id).single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundException(`Nenhum perfil de usuário encontrado para o ID de autenticação: ${id}`);
      }
      throw new Error(error.message);
    }
    return data;
  }

  /**
   * Encontra um usuário pela sua chave primária (id_usuario).
   * @param id - O ID numérico (PK) do usuário.
   * @returns O perfil do usuário correspondente.
   */
  async findOne(id: number) {
    const { data, error } = await this.supabase.from('Usuario').select('*').eq('id_usuario', id).single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundException(`Usuário com ID ${id} não encontrado.`);
      }
      throw new Error(error.message);
    }
    return data;
  }

  /**
   * Atualiza os dados de um usuário existente.
   * @param id - O ID numérico (PK) do usuário a ser atualizado.
   * @param updateUsuarioDto - Os dados a serem atualizados.
   * @returns O perfil do usuário atualizado.
   */
  async update(id: number, updateUsuarioDto: UpdateUsuarioDto) {
    const { data, error } = await this.supabase.from('Usuario').update(updateUsuarioDto).eq('id_usuario', id).select().single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundException(`Usuário com ID ${id} não encontrado para atualização.`);
      }
      throw new Error(error.message);
    }
    return data;
  }

  /**
   * Remove um usuário do banco de dados.
   * @param id - O ID numérico (PK) do usuário a ser removido.
   * @returns Uma mensagem de sucesso.
   */
  async remove(id: number) {
    const { error } = await this.supabase.from('Usuario').delete().eq('id_usuario', id);

    if (error) {
      // O Supabase pode não retornar um erro específico se o ID não existir,
      // então a verificação de erro genérico é suficiente aqui.
      throw new Error(error.message);
    }
    return { message: `Usuário com ID ${id} deletado com sucesso.` };
  }
}
