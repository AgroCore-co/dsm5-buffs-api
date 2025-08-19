import { Injectable, NotFoundException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from '../../../core/supabase/supabase.service';
import { CreateBufaloDto } from './dto/create-bufalo.dto';
import { UpdateBufaloDto } from './dto/update-bufalo.dto';

@Injectable()
export class BufaloService {
  private supabase: SupabaseClient;
  private readonly tableName = 'Bufalo';

  constructor(private readonly supabaseService: SupabaseService) {
    this.supabase = this.supabaseService.getClient();
  }

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
   * Valida a posse da propriedade e a existência de outras referências (raça, grupo, pais).
   */
  private async validateReferencesAndOwnership(dto: CreateBufaloDto | UpdateBufaloDto, userId: number): Promise<void> {
    // 1. Validação de Posse (a mais importante)
    if (dto.id_propriedade) {
      const { data: propriedade, error } = await this.supabase
        .from('Propriedade')
        .select('id_propriedade')
        .eq('id_propriedade', dto.id_propriedade)
        .eq('id_dono', userId) // Garante que a propriedade pertence ao usuário
        .single();
      
      if (error || !propriedade) {
        throw new NotFoundException(`Propriedade com ID ${dto.id_propriedade} não encontrada ou não pertence a este usuário.`);
      }
    }

    // 2. Validação de Referências Adicionais
    const checkIfExists = async (tableName: string, columnName: string, id: number) => {
      const { data, error } = await this.supabase.from(tableName).select(columnName).eq(columnName, id).single();
      if (error || !data) {
        throw new NotFoundException(`${tableName} com ID ${id} não encontrado.`);
      }
    };

    if (dto.id_raca) await checkIfExists('Raca', 'id_raca', dto.id_raca);
    if (dto.id_grupo) await checkIfExists('Grupo', 'id_grupo', dto.id_grupo);
    if (dto.id_pai) await checkIfExists('Bufalo', 'id_bufalo', dto.id_pai);
    if (dto.id_mae) await checkIfExists('Bufalo', 'id_bufalo', dto.id_mae);
  }

  async create(createDto: CreateBufaloDto, user: any) {
    const userId = await this.getUserId(user);
    await this.validateReferencesAndOwnership(createDto, userId);

    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert(createDto)
      .select()
      .single();

    if (error) {
      if (error.code === '23503') { // Erro de chave estrangeira
        throw new BadRequestException('Falha ao criar búfalo: uma das referências (raça, grupo, etc.) é inválida.');
      }
      throw new InternalServerErrorException(`Falha ao criar o búfalo: ${error.message}`);
    }
    return data;
  }

  async findAll(user: any) {
    const userId = await this.getUserId(user);

    // Busca búfalos que estão em propriedades pertencentes ao usuário
    const { data, error } = await this.supabase
      .from('Propriedade')
      .select(`
        id_propriedade,
        nome,
        Bufalo (*)
      `)
      .eq('id_dono', userId);

    if (error) {
      throw new InternalServerErrorException('Falha ao buscar os búfalos.');
    }

    // Extrai e achata a lista de búfalos de todas as propriedades
    const allBufalos = data.flatMap(propriedade => propriedade.Bufalo || []);
    return allBufalos;
  }

  async findOne(id: number, user: any) {
    const userId = await this.getUserId(user);

    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*, Propriedade(id_dono)') // Puxa o id_dono da propriedade relacionada
      .eq('id_bufalo', id)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Búfalo com ID ${id} não encontrado.`);
    }

    // Verifica se a propriedade do búfalo pertence ao usuário
    if (data.Propriedade?.id_dono !== userId) {
      throw new NotFoundException(`Búfalo com ID ${id} não encontrado ou não pertence a este usuário.`);
    }
    
    delete (data as any).Propriedade; // Limpa o objeto de retorno
    return data;
  }

  async update(id: number, updateDto: UpdateBufaloDto, user: any) {
    await this.findOne(id, user); // Garante que o búfalo existe e pertence ao usuário
    
    const userId = await this.getUserId(user);
    await this.validateReferencesAndOwnership(updateDto, userId); // Valida os novos dados

    const { data, error } = await this.supabase
      .from(this.tableName)
      .update(updateDto)
      .eq('id_bufalo', id)
      .select()
      .single();

    if (error) {
      throw new InternalServerErrorException(`Falha ao atualizar o búfalo: ${error.message}`);
    }
    return data;
  }

  async remove(id: number, user: any) {
    await this.findOne(id, user); // Garante que o búfalo existe e pertence ao usuário

    const { error } = await this.supabase.from(this.tableName).delete().eq('id_bufalo', id);

    if (error) {
      throw new InternalServerErrorException('Falha ao remover o búfalo.');
    }
    return;
  }
}