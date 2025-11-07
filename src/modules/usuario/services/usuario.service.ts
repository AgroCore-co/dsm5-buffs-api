import { Injectable, NotFoundException, ConflictException, InternalServerErrorException, ForbiddenException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from 'src/core/supabase/supabase.service';
import { CreateUsuarioDto } from '../dto/create-usuario.dto';
import { UpdateUsuarioDto } from '../dto/update-usuario.dto';
import { Cargo } from '../enums/cargo.enum';
import { LoggerService } from 'src/core/logger/logger.service';
import { formatDateFields, formatDateFieldsArray } from '../../../core/utils/date-formatter.utils';

@Injectable()
export class UsuarioService {
  private readonly supabase: SupabaseClient;

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly logger: LoggerService,
  ) {
    this.supabase = this.supabaseService.getAdminClient();
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

    const { data: existingProfile } = await this.supabase.from('usuario').select('id_usuario').or(`email.eq.${email},auth_id.eq.${authId}`).single();

    if (existingProfile) {
      this.logger.warn(`[UsuarioService] Tentativa de criar perfil duplicado`, { email });
      throw new ConflictException('Este usuário já possui um perfil cadastrado.');
    }

    const { data, error } = await this.supabase
      .from('usuario')
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

    return formatDateFields(data);
  }

  /**
   * Retorna uma lista de todos os usuários.
   */
  async findAll() {
    this.logger.log(`[UsuarioService] findAll chamado`);
    const { data, error } = await this.supabase.from('usuario').select(`
        *,
        endereco:endereco(*)
      `);

    if (error) {
      this.logger.logError(error, { method: 'findAll' });
      throw new InternalServerErrorException(error.message);
    }
    return formatDateFieldsArray(data);
  }

  /**
   * Encontra um perfil de usuário usando seu email.
   * @param email O email do usuário.
   */
  async findOneByEmail(email: string) {
    this.logger.log(`[UsuarioService] findOneByEmail chamado`, { email });
    const { data, error } = await this.supabase
      .from('usuario')
      .select(
        `
        *,
        endereco:endereco(*)
      `,
      )
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') {
      this.logger.logError(error, { method: 'findOneByEmail', email });
      throw new InternalServerErrorException(error.message);
    }
    if (!data) {
      throw new NotFoundException(`Nenhum perfil de usuário encontrado para o email: ${email}`);
    }
    return formatDateFields(data);
  }

  /**
   * Encontra um usuário pela sua chave primária (id_usuario UUID).
   * @param id O ID UUID do usuário.
   */
  async findOne(id: string) {
    this.logger.log(`[UsuarioService] findOne chamado`, { id });
    const { data, error } = await this.supabase
      .from('usuario')
      .select(
        `
        *,
        endereco:endereco(*)
      `,
      )
      .eq('id_usuario', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      this.logger.logError(error, { method: 'findOne', id });
      throw new InternalServerErrorException(error.message);
    }
    if (!data) {
      throw new NotFoundException(`Usuário com ID ${id} não encontrado.`);
    }
    return formatDateFields(data);
  }

  /**
   * Atualiza os dados de um usuário.
   * @param id O ID UUID do usuário.
   * @param updateUsuarioDto Os dados a serem atualizados.
   */
  async update(id: string, updateUsuarioDto: UpdateUsuarioDto) {
    this.logger.log(`[UsuarioService] update chamado`, { id, updateUsuarioDto });
    const { data, error } = await this.supabase
      .from('usuario')
      .update({
        ...updateUsuarioDto,
        updated_at: new Date().toISOString(),
      })
      .eq('id_usuario', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundException(`Usuário com ID ${id} não encontrado para atualização.`);
      }
      this.logger.logError(error, { method: 'update', id });
      throw new InternalServerErrorException(error.message);
    }
    return formatDateFields(data);
  }

  /**
   * Remove um usuário.
   * @param id O ID UUID do usuário.
   */
  async remove(id: string) {
    this.logger.log(`[UsuarioService] remove chamado`, { id });
    const { error, count } = await this.supabase.from('usuario').delete({ count: 'exact' }).eq('id_usuario', id);

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
   * @param userId ID UUID do usuário proprietário.
   */
  async getUserPropriedades(userId: string): Promise<string[]> {
    this.logger.log(`[UsuarioService] getUserPropriedades chamado`, { userId });
    const { data, error } = await this.supabase.from('propriedade').select('id_propriedade').eq('id_dono', userId);

    if (error) {
      this.logger.logError(error, { method: 'getUserPropriedades', userId });
      throw new InternalServerErrorException('Falha ao buscar propriedades do usuário.');
    }

    if (!data || data.length === 0) {
      this.logger.warn(`[UsuarioService] Usuário não possui nenhuma propriedade`, { userId });
      throw new NotFoundException('Usuário não possui nenhuma propriedade cadastrada.');
    }

    return data.map((item) => item.id_propriedade);
  }

  /**
   * Cria um funcionário/gerente/veterinário usando o client admin (service role),
   * e vincula à propriedade informada ou às propriedades do solicitante.
   */
  async createFuncionario(
    dto: {
      nome: string;
      email: string;
      password: string;
      telefone?: string;
      cargo: Cargo;
      id_endereco?: string;
      id_propriedade?: string;
    },
    solicitante: { id_usuario?: string; cargo?: Cargo },
  ) {
    this.logger.log('[UsuarioService] createFuncionario chamado', {
      dtoEmail: dto.email,
      solicitante: solicitante?.id_usuario,
    });

    if (!solicitante?.id_usuario) {
      throw new ForbiddenException('Solicitante inválido.');
    }

    if (solicitante.cargo !== Cargo.PROPRIETARIO && solicitante.cargo !== Cargo.GERENTE) {
      throw new ForbiddenException('Apenas PROPRIETARIO ou GERENTE podem criar funcionários.');
    }

    if (dto.cargo === Cargo.PROPRIETARIO) {
      throw new ForbiddenException('Não é permitido criar usuário com cargo PROPRIETARIO por este endpoint.');
    }

    const admin = this.supabaseService.getAdminClient();

    // 1) Criar o usuário no Auth
    const { data: created, error: authErr } = await admin.auth.admin.createUser({
      email: dto.email,
      password: dto.password,
      email_confirm: true,
      user_metadata: { nome: dto.nome, telefone: dto.telefone },
    });
    if (authErr) {
      this.logger.logError(authErr, { method: 'createFuncionario.auth', email: dto.email });
      throw new InternalServerErrorException(`Erro Auth: ${authErr.message}`);
    }

    const authId = created.user?.id as string;

    // 2) Inserir o perfil na tabela Usuario
    const { data: perfil, error: perfilErr } = await admin
      .from('usuario')
      .insert([
        {
          auth_id: authId,
          nome: dto.nome,
          telefone: dto.telefone ?? null,
          email: dto.email,
          cargo: dto.cargo,
          id_endereco: dto.id_endereco ?? null,
        },
      ])
      .select()
      .single();

    if (perfilErr) {
      this.logger.logError(perfilErr, { method: 'createFuncionario.perfil', email: dto.email });
      throw new InternalServerErrorException(`Erro DB: ${perfilErr.message}`);
    }

    // 3) Vincular à propriedade
    const propriedadesParaVincular: string[] = [];
    if (dto.id_propriedade) {
      propriedadesParaVincular.push(dto.id_propriedade);
    } else {
      const doSolicitante = await this.getUserPropriedades(solicitante.id_usuario);
      propriedadesParaVincular.push(...doSolicitante);
    }

    const rows = propriedadesParaVincular.map((id_propriedade) => ({
      id_usuario: perfil.id_usuario,
      id_propriedade,
    }));
    const { error: vincErr } = await admin.from('usuariopropriedade').insert(rows);
    if (vincErr) {
      this.logger.logError(vincErr, { method: 'createFuncionario.vincular', perfil: perfil.id_usuario });
      throw new InternalServerErrorException('Erro ao vincular funcionário à propriedade.');
    }

    return formatDateFields(perfil);
  }
}
