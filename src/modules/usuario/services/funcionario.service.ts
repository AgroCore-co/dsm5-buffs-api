import { Injectable, ConflictException, ForbiddenException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from 'src/core/supabase/supabase.service';
import { LoggerService } from 'src/core/logger/logger.service';
import { CreateFuncionarioDto } from '../dto/create-funcionario.dto';
import { Cargo } from '../enums/cargo.enum';
import { UsuarioService } from './usuario.service';
import { SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class FuncionarioService {
  private readonly supabase: SupabaseClient;
  private readonly adminSupabase: SupabaseClient;

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly usuarioService: UsuarioService,
    private readonly logger: LoggerService,
  ) {
    this.supabase = this.supabaseService.getClient();
    this.adminSupabase = this.supabaseService.getAdminClient();
  }

  /**
   * Cria um novo funcionário, o autentica no Supabase e o vincula a propriedades.
   * @param createFuncionarioDto Dados do novo funcionário.
   * @param proprietarioEmail Email do proprietário (logado) que está realizando a ação.
   */
  async createFuncionario(createFuncionarioDto: CreateFuncionarioDto, proprietarioEmail: string) {
    this.logger.log(`[FuncionarioService] createFuncionario chamado por ${proprietarioEmail}`);

    if (createFuncionarioDto.cargo === Cargo.PROPRIETARIO) {
      throw new BadRequestException('Não é possível criar um usuário com cargo PROPRIETARIO por este endpoint.');
    }

    const proprietario = await this.usuarioService.findOneByEmail(proprietarioEmail);
    const propriedadesDoProprietario = await this.usuarioService.getUserPropriedades(proprietario.id_usuario);

    if (createFuncionarioDto.id_propriedade && !propriedadesDoProprietario.includes(createFuncionarioDto.id_propriedade)) {
      throw new ForbiddenException('Você só pode criar funcionários para suas próprias propriedades.');
    }

    const { data: authUser, error: authError } = await this.adminSupabase.auth.admin.createUser({
      email: createFuncionarioDto.email,
      password: createFuncionarioDto.password,
      email_confirm: true,
      user_metadata: {
        nome: createFuncionarioDto.nome,
        cargo: createFuncionarioDto.cargo,
      },
    });

    if (authError) {
      this.logger.logError(authError, { method: 'createFuncionario', step: 'supabaseAuth' });
      if (authError.message.includes('already exists')) {
        throw new ConflictException('Este email já está registrado no sistema de autenticação.');
      }
      throw new InternalServerErrorException(`Erro ao criar conta de autenticação: ${authError.message}`);
    }

    try {
      const { data: existingUser } = await this.supabase.from('Usuario').select('id_usuario').eq('email', createFuncionarioDto.email).single();

      if (existingUser) {
        throw new ConflictException('Já existe um perfil de usuário com este email.');
      }

      const { data: novoFuncionario, error: insertError } = await this.adminSupabase
        .from('Usuario')
        .insert([
          {
            auth_id: authUser.user.id,
            nome: createFuncionarioDto.nome,
            email: createFuncionarioDto.email,
            telefone: createFuncionarioDto.telefone,
            cargo: createFuncionarioDto.cargo,
            id_endereco: createFuncionarioDto.id_endereco,
          },
        ])
        .select()
        .single();

      if (insertError) {
        throw new InternalServerErrorException(`Falha ao criar perfil do funcionário: ${insertError.message}`);
      }

      const propriedadesParaVincular = createFuncionarioDto.id_propriedade ? [createFuncionarioDto.id_propriedade] : propriedadesDoProprietario;

      const vinculos = propriedadesParaVincular.map((idPropriedade) => ({
        id_usuario: novoFuncionario.id_usuario,
        id_propriedade: idPropriedade,
      }));

      const { error: vinculoError } = await this.adminSupabase.from('UsuarioPropriedade').insert(vinculos);

      if (vinculoError) {
        throw new InternalServerErrorException(`Falha ao vincular funcionário às propriedades: ${vinculoError.message}`);
      }

      return {
        ...novoFuncionario,
        propriedades_vinculadas: propriedadesParaVincular,
        auth_credentials: {
          email: createFuncionarioDto.email,
          temp_password: createFuncionarioDto.password,
        },
      };
    } catch (error) {
      this.logger.logError(error as Error, { message: 'Erro na transação, realizando rollback do Auth User...', authUserId: authUser.user.id });
      await this.adminSupabase.auth.admin.deleteUser(authUser.user.id);
      throw error;
    }
  }

  /**
   * Lista todos os funcionários de uma propriedade específica
   */
  async listarFuncionariosPorPropriedade(idPropriedade: number, proprietarioEmail: string) {
    this.logger.log(`[FuncionarioService] listarFuncionariosPorPropriedade chamado`, { idPropriedade, proprietarioEmail });

    const proprietario = await this.usuarioService.findOneByEmail(proprietarioEmail);
    const { data: propriedade, error: propError } = await this.supabase
      .from('Propriedade')
      .select('id_dono')
      .eq('id_propriedade', idPropriedade)
      .eq('id_dono', proprietario.id_usuario)
      .single();

    if (propError || !propriedade) {
      this.logger.warn(`[FuncionarioService] Acesso negado: não é proprietário desta propriedade`, { proprietarioEmail, idPropriedade });
      throw new ForbiddenException('Acesso negado: você não é proprietário desta propriedade.');
    }

    const { data, error: funcionariosError } = await this.supabase
      .from('UsuarioPropriedade')
      .select(
        `
        Usuario (
          id_usuario,
          nome,
          email,
          telefone,
          cargo,
          created_at
        )
      `,
      )
      .eq('id_propriedade', idPropriedade);

    if (funcionariosError) {
      this.logger.logError(funcionariosError, { method: 'listarFuncionariosPorPropriedade', idPropriedade });
      throw new InternalServerErrorException('Erro ao buscar funcionários.');
    }
    return data?.map((item) => item.Usuario) || [];
  }

  /**
   * Lista todos os funcionários de todas as propriedades do proprietário
   */
  async listarMeusFuncionarios(proprietarioEmail: string) {
    this.logger.log(`[FuncionarioService] listarMeusFuncionarios chamado`, { proprietarioEmail });

    const proprietario = await this.usuarioService.findOneByEmail(proprietarioEmail);
    const propriedadesProprietario = await this.usuarioService.getUserPropriedades(proprietario.id_usuario);

    const { data, error } = await this.supabase
      .from('UsuarioPropriedade')
      .select(
        `
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
      `,
      )
      .in('id_propriedade', propriedadesProprietario);

    if (error) {
      this.logger.logError(error, { method: 'listarMeusFuncionarios', proprietarioEmail });
      throw new InternalServerErrorException('Erro ao buscar funcionários.');
    }

    return (
      data?.map((item) => ({
        ...item.Usuario,
        propriedade: (item.Propriedade as any)?.nome,
        id_propriedade: item.id_propriedade,
      })) || []
    );
  }

  /**
   * Remove um funcionário de uma propriedade (desvincular)
   */
  async desvincularFuncionario(idUsuario: number, idPropriedade: number, proprietarioEmail: string) {
    this.logger.log(`[FuncionarioService] desvincularFuncionario chamado`, { idUsuario, idPropriedade, proprietarioEmail });

    const proprietario = await this.usuarioService.findOneByEmail(proprietarioEmail);
    const { data: propriedade, error: propError } = await this.supabase
      .from('Propriedade')
      .select('id_dono')
      .eq('id_propriedade', idPropriedade)
      .eq('id_dono', proprietario.id_usuario)
      .single();

    if (propError || !propriedade) {
      this.logger.warn(`[FuncionarioService] Acesso negado para desvincular: não é proprietário`, { proprietarioEmail, idPropriedade });
      throw new ForbiddenException('Acesso negado: você não é proprietário desta propriedade.');
    }

    const { error: desvincularError } = await this.supabase
      .from('UsuarioPropriedade')
      .delete()
      .eq('id_usuario', idUsuario)
      .eq('id_propriedade', idPropriedade);

    if (desvincularError) {
      this.logger.logError(desvincularError, { method: 'desvincularFuncionario', idUsuario, idPropriedade });
      throw new InternalServerErrorException('Erro ao desvincular funcionário.');
    }
    return { message: 'Funcionário desvinculado com sucesso.' };
  }
}
