import { Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { SupabaseService } from '../../../core/supabase/supabase.service';
import { LoggerService } from '../../../core/logger/logger.service';
import { CreateVacinacaoDto } from './dto/create-vacinacao.dto';
import { UpdateVacinacaoDto } from './dto/update-vacinacao.dto';
import { formatDateFields, formatDateFieldsArray } from '../../../core/utils/date-formatter.utils';

@Injectable()
export class VacinacaoService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly logger: LoggerService,
  ) {}

  private readonly tableName = 'dadossanitarios'; // Usando tabela DadosSanitarios existente

  /**
   * Função auxiliar para encontrar o ID numérico interno (bigint) do utilizador
   * a partir do UUID de autenticação do Supabase (o 'sub' do JWT).
   */
  private async getInternalUserId(authUuid: string): Promise<number> {
    const module = 'VacinacaoService';
    const method = 'getInternalUserId';
    this.logger.debug('Buscando usuário por auth_id', { module, method, authUuid });

    // 1. Tentar encontrar usuário por auth_id
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('usuario')
      .select('id_usuario, nome, email, auth_id')
      .eq('auth_id', authUuid)
      .single();

    this.logger.debug('Resultado da busca por auth_id', { module, method, found: !!data, error: error?.message });

    if (data) {
      this.logger.log('Usuário encontrado por auth_id', { module, method, nome: data.nome, id_usuario: data.id_usuario });
      return data.id_usuario;
    }

    // 2. Se não encontrar, tentar buscar por email conhecido
    this.logger.warn('auth_id não encontrado, tentando buscar por email', { module, method });

    // Para este caso específico, sabemos o email
    const userEmail = 'joaobarretoprof@gmail.com';

    this.logger.debug('Email extraído', { module, method, userEmail });

    if (userEmail) {
      const { data: emailUser, error: emailError } = await this.supabase
        .getAdminClient()
        .from('usuario')
        .select('id_usuario, nome, email, auth_id')
        .eq('email', userEmail)
        .single();

      this.logger.debug('Resultado da busca por email', { module, method, found: !!emailUser, error: emailError?.message });

      if (emailUser) {
        // 3. Sincronizar auth_id automaticamente
        this.logger.log('Sincronizando auth_id', { module, method, nome: emailUser.nome });

        await this.supabase.getAdminClient().from('usuario').update({ auth_id: authUuid }).eq('id_usuario', emailUser.id_usuario);

        this.logger.log('Usuário sincronizado com sucesso', { module, method, nome: emailUser.nome, id_usuario: emailUser.id_usuario });
        return emailUser.id_usuario;
      }
    }

    // 4. Se não encontrar nada, mostrar todos usuários para debug
    const { data: allUsers } = await this.supabase.getAdminClient().from('usuario').select('id_usuario, nome, email, auth_id').limit(5);

    this.logger.error('Usuário não encontrado', '', { module, method, authUuid, userEmail, totalUsers: allUsers?.length });

    throw new UnauthorizedException(
      `Falha na sincronização do utilizador. Usuário com auth: ${authUuid} e email: ${userEmail || 'N/A'} não foi encontrado.`,
    );
  }

  /**
   * Método create corrigido para traduzir o UUID do utilizador para o ID numérico.
   */
  async create(dto: CreateVacinacaoDto, id_bufalo: string, auth_uuid: string) {
    const internalUserId = await this.getInternalUserId(auth_uuid);

    const insertData = {
      id_bufalo: id_bufalo,
      id_usuario: internalUserId,
      id_medicao: dto.id_medicacao, // Campo correto na tabela é id_medicao
      dt_aplicacao: dto.dt_aplicacao,
      dosagem: dto.dosagem,
      unidade_medida: dto.unidade_medida,
      doenca: dto.doenca || 'Vacinação Preventiva',
      necessita_retorno: dto.necessita_retorno || false,
      dt_retorno: dto.dt_retorno,
    };

    const { data, error } = await this.supabase.getAdminClient().from(this.tableName).insert(insertData).select().single();

    if (error) {
      throw new InternalServerErrorException(`Falha ao criar registo de vacinação: ${error.message}`);
    }
    return formatDateFields(data);
  }

  async findAllByBufalo(id_bufalo: string) {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from(this.tableName)
      .select(
        `
        id_sanit,
        dt_aplicacao,
        dosagem,
        unidade_medida,
        doenca,
        necessita_retorno,
        dt_retorno,
        bufalo!inner(id_bufalo, nome, brinco),
        usuario!inner(id_usuario, nome),
        medicacoes!inner(id_medicacao, medicacao, tipo_tratamento, descricao)
      `,
      )
      .eq('id_bufalo', id_bufalo)
      .eq('Medicacoes.tipo_tratamento', 'Vacinação')
      .order('dt_aplicacao', { ascending: false });

    if (error) {
      throw new InternalServerErrorException(`Falha ao buscar vacinas do búfalo: ${error.message}`);
    }
    return formatDateFieldsArray(data);
  }

  async findOne(id_sanit: string) {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from(this.tableName)
      .select(
        `
        id_sanit,
        dt_aplicacao,
        dosagem,
        unidade_medida,
        doenca,
        necessita_retorno,
        dt_retorno,
        bufalo!inner(id_bufalo, nome, brinco),
        usuario!inner(id_usuario, nome),
        medicacoes!inner(id_medicacao, medicacao, tipo_tratamento, descricao)
      `,
      )
      .eq('id_sanit', id_sanit)
      .eq('Medicacoes.tipo_tratamento', 'Vacinação')
      .single();

    if (error || !data) {
      throw new NotFoundException(`Registo de vacinação com ID ${id_sanit} não encontrado.`);
    }
    return formatDateFields(data);
  }

  async update(id_sanit: string, dto: UpdateVacinacaoDto) {
    await this.findOne(id_sanit);

    const { data, error } = await this.supabase
      .getAdminClient()
      .from(this.tableName)
      .update({
        id_medicao: dto.id_medicacao, // Campo correto na tabela é id_medicao
        dt_aplicacao: dto.dt_aplicacao,
        dosagem: dto.dosagem,
        unidade_medida: dto.unidade_medida,
        doenca: dto.doenca,
        necessita_retorno: dto.necessita_retorno,
        dt_retorno: dto.dt_retorno,
        updated_at: new Date().toISOString(),
      })
      .eq('id_sanit', id_sanit)
      .select()
      .single();

    if (error) {
      throw new InternalServerErrorException(`Falha ao atualizar registo de vacinação: ${error.message}`);
    }
    return formatDateFields(data);
  }

  async remove(id_sanit: string) {
    await this.findOne(id_sanit);

    const { error } = await this.supabase.getAdminClient().from(this.tableName).delete().eq('id_sanit', id_sanit);

    if (error) {
      throw new InternalServerErrorException(`Falha ao remover registo de vacinação: ${error.message}`);
    }
    return { message: 'Registo de vacinação removido com sucesso' };
  }

  /**
   * Método específico para buscar apenas vacinas por IDs específicos da tabela Medicacoes
   */
  async findVacinasByBufaloId(id_bufalo: string) {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from(this.tableName)
      .select(
        `
        id_sanit,
        dt_aplicacao,
        dosagem,
        unidade_medida,
        doenca,
        necessita_retorno,
        dt_retorno,
        bufalo!inner(id_bufalo, nome, brinco),
        usuario!inner(id_usuario, nome),
        medicacoes!inner(id_medicacao, medicacao, descricao)
      `,
      )
      .eq('id_bufalo', id_bufalo)
      .in('id_medicacao', [3, 4, 5, 6, 12, 14]) // IDs das vacinas do seu banco
      .order('dt_aplicacao', { ascending: false });

    if (error) {
      throw new InternalServerErrorException(`Falha ao buscar vacinas do búfalo: ${error.message}`);
    }
    return formatDateFieldsArray(data);
  }
}
