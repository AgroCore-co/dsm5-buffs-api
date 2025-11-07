import { Injectable, NotFoundException, InternalServerErrorException, BadRequestException, Logger } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from '../../../core/supabase/supabase.service';
import { CreatePropriedadeDto } from './dto/create-propiedade.dto';
import { UpdatePropriedadeDto } from './dto/update-propriedade.dto';
import { formatDateFields, formatDateFieldsArray } from '../../../core/utils/date-formatter.utils';

@Injectable()
export class PropriedadeService {
  private readonly logger = new Logger(PropriedadeService.name);
  private supabase: SupabaseClient;

  constructor(private readonly supabaseService: SupabaseService) {
    this.supabase = this.supabaseService.getAdminClient();
  }

  /**
   * Método privado para obter o ID UUID do usuário a partir do token.
   * Reutilizado em vários métodos para evitar repetição de código.
   */
  private async getUserId(user: any): Promise<string> {
    const { data: perfilUsuario, error } = await this.supabase.from('usuario').select('id_usuario').eq('email', user.email).single();

    if (error || !perfilUsuario) {
      throw new NotFoundException('Perfil de usuário não encontrado.');
    }
    return perfilUsuario.id_usuario;
  }

  async create(createPropriedadeDto: CreatePropriedadeDto, user: any) {
    const idDono = await this.getUserId(user);

    const { data: novaPropriedade, error: propriedadeError } = await this.supabase
      .from('propriedade')
      .insert([{ ...createPropriedadeDto, id_dono: idDono }])
      .select()
      .single();

    if (propriedadeError) {
      if (propriedadeError.code === '23503') {
        throw new BadRequestException(`O endereço com id ${createPropriedadeDto.id_endereco} não foi encontrado.`);
      }
      console.error('Erro ao criar propriedade:', propriedadeError);
      throw new InternalServerErrorException('Falha ao criar a propriedade.');
    }

    return formatDateFields(novaPropriedade);
  }

  /**
   * Lista todas as propriedades vinculadas ao usuário (como dono OU funcionário)
   */
  async findAll(user: any) {
    const userId = await this.getUserId(user);
    this.logger.log(`[INICIO] Buscando propriedades do usuário ${userId}`);

    try {
      // 1. Busca propriedades onde o usuário é DONO
      const { data: propriedadesComoDono, error: errorDono } = await this.supabase.from('propriedade').select('*').eq('id_dono', userId);

      if (errorDono) {
        this.logger.error(`[ERRO] Falha na consulta propriedades como dono: ${errorDono.message}`);
        throw new InternalServerErrorException(`Erro ao buscar propriedades: ${errorDono.message}`);
      }

      // 2. Busca propriedades onde o usuário é FUNCIONÁRIO
      const { data: propriedadesComoFuncionario, error: errorFuncionario } = await this.supabase
        .from('usuariopropriedade')
        .select('id_propriedade, propriedade(*)')
        .eq('id_usuario', userId);

      if (errorFuncionario) {
        this.logger.error(`[ERRO] Falha na consulta propriedades como funcionário: ${errorFuncionario.message}`);
        throw new InternalServerErrorException(`Erro ao buscar propriedades vinculadas: ${errorFuncionario.message}`);
      }

      // 3. Combina as propriedades (removendo duplicatas)
      const propriedadesFuncionario = propriedadesComoFuncionario?.map((item: any) => item.propriedade) || [];
      const todasPropriedades = [...(propriedadesComoDono || []), ...propriedadesFuncionario];

      // Remove duplicatas pelo id_propriedade
      const propriedadesUnicas = Array.from(new Map(todasPropriedades.map((p) => [p.id_propriedade, p])).values());

      this.logger.log(`[SUCESSO] ${propriedadesUnicas.length} propriedades encontradas para o usuário ${userId}`);

      const formattedPropriedades = formatDateFieldsArray(propriedadesUnicas);
      return {
        message: 'Propriedades recuperadas com sucesso',
        total: formattedPropriedades.length,
        propriedades: formattedPropriedades,
      };
    } catch (error) {
      this.logger.error(`[ERRO_GERAL] ${error.message}`);
      throw error;
    }
  }

  /**
   * Busca uma propriedade específica, garantindo que ela pertença ao usuário logado.
   */
  async findOne(id: string, user: any) {
    const userId = await this.getUserId(user);

    // 1. Verifica se o usuário é dono da propriedade
    const { data: propriedadeComoDono, error: erroDono } = await this.supabase
      .from('propriedade')
      .select('*')
      .eq('id_propriedade', id)
      .eq('id_dono', userId)
      .single();

    if (propriedadeComoDono && !erroDono) {
      return formatDateFields(propriedadeComoDono);
    }

    // 2. Verifica se o usuário é funcionário vinculado à propriedade
    const { data: vinculo, error: erroVinculo } = await this.supabase
      .from('usuariopropriedade')
      .select('propriedade(*)')
      .eq('id_usuario', userId)
      .eq('id_propriedade', id)
      .single();

    if (vinculo && !erroVinculo) {
      return formatDateFields(vinculo.propriedade);
    }

    throw new NotFoundException(`Propriedade com ID ${id} não encontrada ou não pertence a este usuário.`);
  }

  /**
   * Atualiza uma propriedade, verificando a posse antes de realizar a operação.
   * Apenas donos podem atualizar propriedades.
   */
  async update(id: string, updatePropriedadeDto: UpdatePropriedadeDto, user: any) {
    const userId = await this.getUserId(user);

    // Verifica se o usuário é DONO da propriedade (apenas donos podem atualizar)
    const { data: propriedade, error } = await this.supabase
      .from('propriedade')
      .select('id_propriedade')
      .eq('id_propriedade', id)
      .eq('id_dono', userId)
      .single();

    if (error || !propriedade) {
      throw new NotFoundException(`Propriedade com ID ${id} não encontrada ou você não tem permissão para atualizá-la.`);
    }

    const { data, error: updateError } = await this.supabase
      .from('propriedade')
      .update({
        ...updatePropriedadeDto,
        updated_at: new Date().toISOString(),
      })
      .eq('id_propriedade', id)
      .select()
      .single();

    if (updateError) {
      throw new InternalServerErrorException('Falha ao atualizar a propriedade.');
    }

    return formatDateFields(data);
  }

  /**
   * Remove uma propriedade, verificando a posse antes de deletar.
   * Apenas donos podem remover propriedades.
   */
  async remove(id: string, user: any) {
    const userId = await this.getUserId(user);

    // Verifica se o usuário é DONO da propriedade (apenas donos podem deletar)
    const { data: propriedade, error } = await this.supabase
      .from('propriedade')
      .select('id_propriedade')
      .eq('id_propriedade', id)
      .eq('id_dono', userId)
      .single();

    if (error || !propriedade) {
      throw new NotFoundException(`Propriedade com ID ${id} não encontrada ou você não tem permissão para removê-la.`);
    }

    const { error: deleteError } = await this.supabase.from('propriedade').delete().eq('id_propriedade', id);

    if (deleteError) {
      throw new InternalServerErrorException('Falha ao remover a propriedade.');
    }

    // Retornar void é a prática padrão para DELETE, resultando em status 204 No Content.
    return;
  }
}
