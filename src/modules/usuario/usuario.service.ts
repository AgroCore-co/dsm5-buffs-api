import { Injectable, NotFoundException, ConflictException, ForbiddenException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from '../../core/supabase/supabase.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { CreateFuncionarioDto } from './dto/create-funcionario.dto';
import { Cargo } from './enums/cargo.enum';

@Injectable()
export class UsuarioService {
  private supabase: SupabaseClient;

  constructor(private readonly supabaseService: SupabaseService) {
    this.supabase = this.supabaseService.getClient();
  }

  /**
   * Cria um novo perfil de usuário associado a um ID de autenticação.
   * @param createUsuarioDto - Dados para o novo perfil.
   * @param email - Email extraído do JWT.
   * @param authId - O auth_id (UUID) do Supabase extraído do JWT.
   * @returns O perfil do usuário recém-criado.
   */
  async create(createUsuarioDto: CreateUsuarioDto, email: string, authId: string) {
    // Verifica se usuário já tem perfil (por email OU auth_id)
    const { data: existingProfile } = await this.supabase.from('Usuario').select('id_usuario').or(`email.eq.${email},auth_id.eq.${authId}`).single();

    if (existingProfile) {
      throw new ConflictException('Este usuário já possui um perfil cadastrado.');
    }

    // Cria perfil SEMPRE como PROPRIETARIO com auth_id
    const { data, error } = await this.supabase
      .from('Usuario')
      .insert([{ 
        ...createUsuarioDto, 
        email,
        auth_id: authId,              // ← AGORA SALVA O AUTH_ID!
        cargo: Cargo.PROPRIETARIO     // ← SEMPRE PROPRIETARIO para este método
      }])
      .select()
      .single();

    if (error) {
      throw new BadRequestException(`Erro ao criar perfil: ${error.message}`);
    }
    
    return {
      ...data,
      message: 'Perfil de proprietário criado com sucesso'
    };
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

  /**
   * Busca o ID do usuário pelo email
   */
  private async getUserId(email: string): Promise<number> {
    const { data: perfilUsuario, error } = await this.supabase
      .from('Usuario')
      .select('id_usuario')
      .eq('email', email)
      .single();

    if (error || !perfilUsuario) {
      throw new NotFoundException('Perfil de usuário não encontrado.');
    }
    return perfilUsuario.id_usuario;
  }

  /**
   * Busca todas as propriedades onde o usuário é proprietário
   */
  private async getUserPropriedades(userId: number): Promise<number[]> {
    const { data, error } = await this.supabase
      .from('Propriedade')
      .select('id_propriedade')
      .eq('id_dono', userId);

    if (error) {
      throw new InternalServerErrorException('Falha ao buscar propriedades do usuário.');
    }

    if (!data || data.length === 0) {
      throw new NotFoundException('Usuário não possui nenhuma propriedade.');
    }

    return data.map(item => item.id_propriedade);
  }

  /**
   * Cria um funcionário e o vincula a uma propriedade (apenas proprietários podem fazer isso)
   */
  async createFuncionario(createFuncionarioDto: CreateFuncionarioDto, proprietarioEmail: string) {
    // Validação: não permitir criação de PROPRIETARIO via este endpoint
    if (createFuncionarioDto.cargo === Cargo.PROPRIETARIO) {
      throw new BadRequestException('Não é possível criar usuário com cargo PROPRIETARIO através deste endpoint. Use POST /usuarios');
    }

    const proprietarioId = await this.getUserId(proprietarioEmail);
    
    // Busca as propriedades do proprietário
    const propriedadesProprietario = await this.getUserPropriedades(proprietarioId);
    
    // Se foi especificado id_propriedade, verifica se pertence ao proprietário
    if (createFuncionarioDto.id_propriedade) {
      if (!propriedadesProprietario.includes(createFuncionarioDto.id_propriedade)) {
        throw new ForbiddenException('Você só pode criar funcionários para suas próprias propriedades.');
      }
    }

    // Usar cliente admin para operações de autenticação
    const adminSupabase = this.supabaseService.getAdminClient();

    // 1. PRIMEIRO: Criar conta no Supabase Auth usando cliente admin
    const { data: authUser, error: authError } = await adminSupabase.auth.admin.createUser({
      email: createFuncionarioDto.email,
      password: createFuncionarioDto.password,
      email_confirm: true,  // Confirma email automaticamente
      user_metadata: {
        nome: createFuncionarioDto.nome,
        cargo: createFuncionarioDto.cargo
      }
    });

    if (authError) {
      console.error('Erro Supabase Auth:', authError);
      throw new BadRequestException(`Erro ao criar conta de autenticação: ${authError.message}`);
    }

    try {
      // Verifica se o email já existe na tabela Usuario
      const { data: existingUser } = await this.supabase
        .from('Usuario')
        .select('id_usuario')
        .eq('email', createFuncionarioDto.email)
        .single();

      if (existingUser) {
        // Se der erro, remove a conta criada no Supabase Auth usando cliente admin
        await adminSupabase.auth.admin.deleteUser(authUser.user.id);
        throw new ConflictException('Já existe um usuário com este email.');
      }

      // 2. SEGUNDO: Cria o perfil na tabela Usuario COM auth_id
      const { data: novoFuncionario, error } = await this.supabase
        .from('Usuario')
        .insert([{
          auth_id: authUser.user.id,        // ← AGORA SALVA O AUTH_ID!
          nome: createFuncionarioDto.nome,
          email: createFuncionarioDto.email,
          telefone: createFuncionarioDto.telefone,
          cargo: createFuncionarioDto.cargo,
          id_endereco: createFuncionarioDto.id_endereco
        }])
        .select()
        .single();

      if (error) {
        // Se falhar, remove a conta do Supabase Auth usando cliente admin
        await adminSupabase.auth.admin.deleteUser(authUser.user.id);
        throw new InternalServerErrorException(`Falha ao criar funcionário: ${error.message}`);
      }

      // Determina as propriedades para vincular
      const propriedadesParaVincular = createFuncionarioDto.id_propriedade 
        ? [createFuncionarioDto.id_propriedade]
        : propriedadesProprietario;

      // Vincula o funcionário às propriedades
      const vinculos = propriedadesParaVincular.map(idPropriedade => ({
        id_usuario: novoFuncionario.id_usuario,
        id_propriedade: idPropriedade
      }));

      const { error: vinculoError } = await this.supabase
        .from('UsuarioPropriedade')
        .insert(vinculos);

      if (vinculoError) {
        // Se falhar o vínculo, remove o usuário criado E a conta do Supabase Auth usando cliente admin
        await this.supabase.from('Usuario').delete().eq('id_usuario', novoFuncionario.id_usuario);
        await adminSupabase.auth.admin.deleteUser(authUser.user.id);
        throw new InternalServerErrorException(`Falha ao vincular funcionário às propriedades: ${vinculoError.message}`);
      }

      return {
        ...novoFuncionario,
        propriedades_vinculadas: propriedadesParaVincular,
        auth_credentials: {
          email: createFuncionarioDto.email,
          temp_password: createFuncionarioDto.password
        }
      };

    } catch (error) {
      // Se algo der errado, limpa a conta criada no Supabase Auth usando cliente admin
      await adminSupabase.auth.admin.deleteUser(authUser.user.id);
      throw error;
    }
  }

  /**
   * Lista todos os funcionários de uma propriedade específica
   */
  async listarFuncionariosPorPropriedade(idPropriedade: number, proprietarioEmail: string) {
    const proprietarioId = await this.getUserId(proprietarioEmail);
    
    // Verifica se o usuário é dono da propriedade
    const { data: propriedade, error } = await this.supabase
      .from('Propriedade')
      .select('id_dono')
      .eq('id_propriedade', idPropriedade)
      .eq('id_dono', proprietarioId)
      .single();

    if (error || !propriedade) {
      throw new ForbiddenException('Acesso negado: você não é proprietário desta propriedade.');
    }

    // Busca funcionários vinculados à propriedade
    const { data, error: funcionariosError } = await this.supabase
      .from('UsuarioPropriedade')
      .select(`
        Usuario (
          id_usuario,
          nome,
          email,
          telefone,
          cargo,
          created_at
        )
      `)
      .eq('id_propriedade', idPropriedade);

    if (funcionariosError) {
      throw new InternalServerErrorException('Erro ao buscar funcionários.');
    }

    return data?.map(item => item.Usuario) || [];
  }

  /**
   * Lista todos os funcionários de todas as propriedades do proprietário
   */
  async listarMeusFuncionarios(proprietarioEmail: string) {
    const proprietarioId = await this.getUserId(proprietarioEmail);
    const propriedadesProprietario = await this.getUserPropriedades(proprietarioId);

    // Busca funcionários de todas as propriedades do proprietário
    const { data, error } = await this.supabase
      .from('UsuarioPropriedade')
      .select(`
        id_propriedade,
        Usuario (
          id_usuario,
          nome,
          email,
          telefone,
          cargo,
          created_at
        ),
        Propriedade (
          nome
        )
      `)
      .in('id_propriedade', propriedadesProprietario);

    if (error) {
      throw new InternalServerErrorException('Erro ao buscar funcionários.');
    }

    return data?.map(item => ({
      ...item.Usuario,
      propriedade: (item.Propriedade as any)?.nome,
      id_propriedade: item.id_propriedade
    })) || [];
  }

  /**
   * Remove um funcionário de uma propriedade (desvincular)
   */
  async desvincularFuncionario(idUsuario: number, idPropriedade: number, proprietarioEmail: string) {
    const proprietarioId = await this.getUserId(proprietarioEmail);
    
    // Verifica se o usuário é dono da propriedade
    const { data: propriedade, error } = await this.supabase
      .from('Propriedade')
      .select('id_dono')
      .eq('id_propriedade', idPropriedade)
      .eq('id_dono', proprietarioId)
      .single();

    if (error || !propriedade) {
      throw new ForbiddenException('Acesso negado: você não é proprietário desta propriedade.');
    }

    // Remove o vínculo
    const { error: desvincularError } = await this.supabase
      .from('UsuarioPropriedade')
      .delete()
      .eq('id_usuario', idUsuario)
      .eq('id_propriedade', idPropriedade);

    if (desvincularError) {
      throw new InternalServerErrorException('Erro ao desvincular funcionário.');
    }

    return { message: 'Funcionário desvinculado com sucesso.' };
  }
}
