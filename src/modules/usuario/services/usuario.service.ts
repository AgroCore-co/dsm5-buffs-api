import { Injectable, NotFoundException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from 'src/core/supabase/supabase.service';
import { CreateUsuarioDto } from '../dto/create-usuario.dto';
import { UpdateUsuarioDto } from '../dto/update-usuario.dto';
import { Cargo } from '../enums/cargo.enum';
import { LoggerService } from 'src/core/logger/logger.service';

@Injectable()
export class UsuarioService {
  private readonly supabase: SupabaseClient;

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly logger: LoggerService,
  ) {
    this.supabase = this.supabaseService.getClient();
  }

  /**
   * Cria um novo perfil de usuário PROPRIETARIO.
   * @param createUsuarioDto Dados para o novo perfil.
   * @param email Email extraído do JWT.
   * @param authId O auth_id (UUID) do Supabase extraído do JWT.
   * @returns O perfil do usuário recém-criado.
   */
  async create(createUsuarioDto: CreateUsuarioDto, email: string, authId: string) {
    this.logger.log(`[UsuarioService] create chamado`, { email, authId });

    const { data: existingProfile } = await this.supabase.from('Usuario').select('id_usuario').or(`email.eq.${email},auth_id.eq.${authId}`).single();

    if (existingProfile) {
      this.logger.warn(`[UsuarioService] Tentativa de criar perfil duplicado`, { email });
      throw new ConflictException('Este usuário já possui um perfil cadastrado.');
    }

    const { data, error } = await this.supabase
      .from('Usuario')
      .insert([
        {
          ...createUsuarioDto,
          email,
          auth_id: authId,
          cargo: Cargo.PROPRIETARIO,
        },
      ])
      .select()
      .single();

    if (error) {
      this.logger.logError(error, { method: 'create', email });
      throw new InternalServerErrorException(`Erro ao criar perfil de usuário: ${error.message}`);
    }

    return data;
  }

  /**
   * Retorna uma lista de todos os usuários.
   */
  async findAll() {
    this.logger.log(`[UsuarioService] findAll chamado`);
    const { data, error } = await this.supabase.from('Usuario').select('*');

    if (error) {
      this.logger.logError(error, { method: 'findAll' });
      throw new InternalServerErrorException(error.message);
    }
    return data;
  }

  /**
   * Encontra um perfil de usuário usando seu email.
   * @param email O email do usuário.
   */
  async findOneByEmail(email: string) {
    this.logger.log(`[UsuarioService] findOneByEmail chamado`, { email });
    const { data, error } = await this.supabase.from('Usuario').select('*').eq('email', email).single();

    if (error && error.code !== 'PGRST116') {
      this.logger.logError(error, { method: 'findOneByEmail', email });
      throw new InternalServerErrorException(error.message);
    }
    if (!data) {
      throw new NotFoundException(`Nenhum perfil de usuário encontrado para o email: ${email}`);
    }
    return data;
  }

  /**
   * Encontra um usuário pela sua chave primária (id_usuario).
   * @param id O ID numérico (PK) do usuário.
   */
  async findOne(id: number) {
    this.logger.log(`[UsuarioService] findOne chamado`, { id });
    const { data, error } = await this.supabase.from('Usuario').select('*').eq('id_usuario', id).single();

    if (error && error.code !== 'PGRST116') {
      this.logger.logError(error, { method: 'findOne', id });
      throw new InternalServerErrorException(error.message);
    }
    if (!data) {
      throw new NotFoundException(`Usuário com ID ${id} não encontrado.`);
    }
    return data;
  }

  /**
   * Atualiza os dados de um usuário.
   * @param id O ID numérico (PK) do usuário.
   * @param updateUsuarioDto Os dados a serem atualizados.
   */
  async update(id: number, updateUsuarioDto: UpdateUsuarioDto) {
    this.logger.log(`[UsuarioService] update chamado`, { id, updateUsuarioDto });
    const { data, error } = await this.supabase.from('Usuario').update(updateUsuarioDto).eq('id_usuario', id).select().single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundException(`Usuário com ID ${id} não encontrado para atualização.`);
      }
      this.logger.logError(error, { method: 'update', id });
      throw new InternalServerErrorException(error.message);
    }
    return data;
  }

  /**
   * Remove um usuário.
   * @param id O ID numérico (PK) do usuário.
   */
  async remove(id: number) {
    this.logger.log(`[UsuarioService] remove chamado`, { id });
    const { error, count } = await this.supabase.from('Usuario').delete({ count: 'exact' }).eq('id_usuario', id);

    if (count === 0) {
      throw new NotFoundException(`Usuário com ID ${id} não encontrado para remoção.`);
    }

    if (error) {
      this.logger.logError(error, { method: 'remove', id });
      throw new InternalServerErrorException(error.message);
    }
    return { message: `Usuário com ID ${id} deletado com sucesso.` };
  }

  /**
   * Busca todas as propriedades onde o usuário é o dono.
   * @param userId ID do usuário proprietário.
   */
  async getUserPropriedades(userId: number): Promise<number[]> {
    this.logger.log(`[UsuarioService] getUserPropriedades chamado`, { userId: String(userId) });
    const { data, error } = await this.supabase.from('Propriedade').select('id_propriedade').eq('id_dono', userId);

    if (error) {
      this.logger.logError(error, { method: 'getUserPropriedades', userId: String(userId) });
      throw new InternalServerErrorException('Falha ao buscar propriedades do usuário.');
    }

    if (!data || data.length === 0) {
      this.logger.warn(`[UsuarioService] Usuário não possui nenhuma propriedade`, { userId: String(userId) });
      throw new NotFoundException('Usuário não possui nenhuma propriedade cadastrada.');
    }

    return data.map((item) => item.id_propriedade);
  }
}
