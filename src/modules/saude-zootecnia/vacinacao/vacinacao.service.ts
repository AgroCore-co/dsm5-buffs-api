import { Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { SupabaseService } from '../../../core/supabase/supabase.service';
import { CreateVacinacaoDto } from './dto/create-vacinacao.dto';
import { UpdateVacinacaoDto } from './dto/update-vacinacao.dto';

@Injectable()
export class VacinacaoService {
  constructor(private readonly supabase: SupabaseService) {}

  private readonly tableName = 'Vacinacao'; // Assumindo que a tabela se chama Vacinacao

  /**
   * Função auxiliar para encontrar o ID numérico interno (bigint) do utilizador
   * a partir do UUID de autenticação do Supabase (o 'sub' do JWT).
   */
  private async getInternalUserId(authUuid: string): Promise<number> {
    const { data, error } = await this.supabase
      .getClient()
      .from('Usuario') // Tabela 'Usuario' (singular)
      .select('id_usuario') // Coluna 'id_usuario' (o bigint PK)
      .eq('auth_id', authUuid) // Coluna 'auth_id' (o UUID)
      .single();

    if (error || !data) {
      throw new UnauthorizedException(
        `Falha na sincronização do utilizador. O utilizador (auth: ${authUuid}) não foi encontrado no registo local 'Usuario'.`,
      );
    }

    return data.id_usuario;
  }

  /**
   * Método create corrigido para traduzir o UUID do utilizador para o ID numérico.
   */
  async create(dto: CreateVacinacaoDto, id_bufalo: number, auth_uuid: string) {
    // 1. Traduzir o Auth UUID (string) para o ID interno (bigint)
    const internalUserId = await this.getInternalUserId(auth_uuid);

    // 2. Inserir no banco de dados com os IDs corretos
    const { data, error } = await this.supabase
      .getClient()
      .from(this.tableName)
      .insert({
        ...dto,
        id_bufalo: id_bufalo,
        id_usuario: internalUserId, // <-- CORRIGIDO: Inserindo o ID numérico
      })
      .select()
      .single();

    if (error) {
      throw new InternalServerErrorException(`Falha ao criar registo de vacinação: ${error.message}`);
    }
    return data;
  }

  async findAllByBufalo(id_bufalo: number) {
    const { data, error } = await this.supabase
      .getClient()
      .from(this.tableName)
      .select('*')
      .eq('id_bufalo', id_bufalo)
      .order('dt_aplicacao', { ascending: false });

    if (error) {
      throw new InternalServerErrorException(`Falha ao buscar vacinas do búfalo: ${error.message}`);
    }
    return data;
  }

  async findOne(id_vacinacao: number) {
    const { data, error } = await this.supabase.getClient().from(this.tableName).select('*').eq('id_vacinacao', id_vacinacao).single();

    if (error || !data) {
      throw new NotFoundException(`Registo de vacinação com ID ${id_vacinacao} não encontrado.`);
    }
    return data;
  }

  async update(id_vacinacao: number, dto: UpdateVacinacaoDto) {
    await this.findOne(id_vacinacao);

    const { data, error } = await this.supabase.getClient().from(this.tableName).update(dto).eq('id_vacinacao', id_vacinacao).select().single();

    if (error) {
      throw new InternalServerErrorException(`Falha ao atualizar registo de vacinação: ${error.message}`);
    }
    return data;
  }

  async remove(id_vacinacao: number) {
    await this.findOne(id_vacinacao);

    const { error } = await this.supabase.getClient().from(this.tableName).delete().eq('id_vacinacao', id_vacinacao);

    if (error) {
      throw new InternalServerErrorException(`Falha ao remover registo de vacinação: ${error.message}`);
    }
    return { message: 'Registo de vacinação removido com sucesso' };
  }
}
