import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseService } from '../../../core/supabase/supabase.service';
import { CreateDadosSanitariosDto } from './dto/create-dados-sanitarios.dto';
import { UpdateDadosSanitariosDto } from './dto/update-dados-sanitarios.dto';

@Injectable()
export class DadosSanitariosService {
  constructor(private readonly supabase: SupabaseService) {}

  private readonly tableName = 'DadosSanitarios';
  private readonly tableMedicacoes = 'Medicacoes';

  /**
   * Função auxiliar para encontrar o ID numérico interno (bigint) do utilizador
   * a partir do UUID de autenticação do Supabase (o 'sub' do JWT).
   */
  private async getInternalUserId(authUuid: string): Promise<number> {
    const { data, error } = await this.supabase
      .getClient()
      .from('Usuario')
      .select('id_usuario')
      .eq('auth_id', authUuid)
      .single();

    if (error || !data) {
      throw new UnauthorizedException(
        `Falha na sincronização do utilizador. O utilizador (auth: ${authUuid}) não foi encontrado no registo local 'Usuario'.`,
      );
    }

    return data.id_usuario;
  }

  /**
   * O parâmetro 'auth_uuid' é o 'sub' (string UUID) vindo do controller.
   */
  async create(dto: CreateDadosSanitariosDto, auth_uuid: string) {
    // 1. Validar se a medicação existe
    const { data: medicacao, error: errorMedicacao } = await this.supabase
      .getClient()
      .from(this.tableMedicacoes)
      .select('id_medicacao')
      .eq('id_medicacao', dto.id_medicao)
      .single();

    if (errorMedicacao || !medicacao) {
      throw new BadRequestException(`Medicação com ID ${dto.id_medicao} não encontrada.`);
    }

    // 2. Traduzir o Auth UUID (string) para o ID interno (bigint)
    const internalUserId = await this.getInternalUserId(auth_uuid);

    // 3. Inserir no banco de dados usando o ID numérico (bigint) correto
    const { data, error } = await this.supabase
      .getClient()
      .from(this.tableName)
      .insert({
        // O DTO não contém mais id_usuario, então espalhamos apenas os campos válidos
        ...dto,
        id_usuario: internalUserId, // <-- CORRIGIDO: Inserindo o ID numérico correto
      })
      .select()
      .single();

    if (error) {
      throw new InternalServerErrorException(`Falha ao criar dado sanitário: ${error.message}`);
    }
    return data;
  }

  async findAll() {
    const { data, error } = await this.supabase
      .getClient()
      .from(this.tableName)
      .select(
        `
        *,
        medicacao:Medicacoes!inner(id_medicacao, tipo_tratamento, medicacao, descricao)
      `,
      )
      .order('dt_aplicacao', { ascending: false });

    if (error) {
      throw new InternalServerErrorException(`Falha ao buscar dados sanitários: ${error.message}`);
    }
    return data;
  }

  async findByBufalo(id_bufalo: number) {
    const { data, error } = await this.supabase
      .getClient()
      .from(this.tableName)
      .select(
        `
        *,
        medicacao:Medicacoes!inner(id_medicacao, tipo_tratamento, medicacao, descricao)
      `,
      )
      .eq('id_bufalo', id_bufalo)
      .order('dt_aplicacao', { ascending: false });

    if (error) {
      throw new InternalServerErrorException(`Falha ao buscar dados sanitários do búfalo: ${error.message}`);
    }
    return data;
  }

  async findOne(id_sanit: number) {
    const { data, error } = await this.supabase
      .getClient()
      .from(this.tableName)
      .select(
        `
        *,
        medicacao:Medicacoes!inner(id_medicacao, tipo_tratamento, medicacao, descricao)
      `,
      )
      .eq('id_sanit', id_sanit)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Dado sanitário com ID ${id_sanit} não encontrado.`);
    }
    return data;
  }

  async update(id_sanit: number, dto: UpdateDadosSanitariosDto) {
    await this.findOne(id_sanit);

    if (dto.id_medicao) {
      const { data: medicacao, error: errorMedicacao } = await this.supabase
        .getClient()
        .from(this.tableMedicacoes)
        .select('id_medicacao')
        .eq('id_medicao', dto.id_medicao)
        .single();

      if (errorMedicacao || !medicacao) {
        throw new BadRequestException(`Medicação com ID ${dto.id_medicao} não encontrada.`);
      }
    }

    const { data, error } = await this.supabase.getClient().from(this.tableName).update(dto).eq('id_sanit', id_sanit).select().single();

    if (error) {
      throw new InternalServerErrorException(`Falha ao atualizar dado sanitário: ${error.message}`);
    }
    return data;
  }

  async remove(id_sanit: number) {
    await this.findOne(id_sanit);

    const { error } = await this.supabase.getClient().from(this.tableName).delete().eq('id_sanit', id_sanit);

    if (error) {
      throw new InternalServerErrorException(`Falha ao remover dado sanitário: ${error.message}`);
    }
    return { message: 'Registro removido com sucesso' };
  }
}
