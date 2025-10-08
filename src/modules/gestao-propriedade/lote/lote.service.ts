import { Injectable, InternalServerErrorException, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from '../../../core/supabase/supabase.service';
import { CreateLoteDto } from './dto/create-lote.dto';
import { UpdateLoteDto } from './dto/update-lote.dto';

@Injectable()
export class LoteService {
  private supabase: SupabaseClient;

  constructor(private readonly supabaseService: SupabaseService) {
    this.supabase = this.supabaseService.getClient();
  }

  private async getUserId(user: any): Promise<string> {
    const { data: perfilUsuario, error } = await this.supabase.from('Usuario').select('id_usuario').eq('email', user.email).single();

    if (error || !perfilUsuario) {
      throw new NotFoundException('Perfil de usuário não encontrado.');
    }
    return perfilUsuario.id_usuario;
  }

  // Com geo_mapa em JSON no banco, não é necessário parse/stringify
  private parseGeoMapa(lote: any): any {
    return lote;
  }

  private async validateOwnership(propriedadeId: string, userId: string) {
    // Verifica se o usuário é dono da propriedade
    const { data: propriedadeComoDono } = await this.supabase
      .from('Propriedade')
      .select('id_propriedade')
      .eq('id_propriedade', propriedadeId)
      .eq('id_dono', userId)
      .single();

    if (propriedadeComoDono) {
      return; // É dono, pode prosseguir
    }

    // Se não é dono, verifica se é funcionário vinculado à propriedade
    const { data: propriedadeComoFuncionario } = await this.supabase
      .from('UsuarioPropriedade')
      .select('id_propriedade')
      .eq('id_propriedade', propriedadeId)
      .eq('id_usuario', userId)
      .single();

    if (!propriedadeComoFuncionario) {
      throw new NotFoundException(`Propriedade com ID ${propriedadeId} não encontrada ou não pertence a este usuário.`);
    }
  }

  async create(createLoteDto: CreateLoteDto, user: any) {
    const userId = await this.getUserId(user);
    await this.validateOwnership(createLoteDto.id_propriedade, userId);

    // Inserção direta; geo_mapa já é objeto JSON
    const loteToInsert = {
      ...createLoteDto,
    };

    const { data, error } = await this.supabase.from('Lote').insert(loteToInsert).select().single();

    if (error) {
      if (error.code === '23503') {
        // Erro de chave estrangeira
        throw new BadRequestException(`A propriedade com ID ${createLoteDto.id_propriedade} não existe.`);
      }
      throw new InternalServerErrorException('Falha ao criar o lote.');
    }
    // Parseia o retorno para o cliente
    return this.parseGeoMapa(data);
  }

  async findAllByPropriedade(id_propriedade: string, user: any) {
    const userId = await this.getUserId(user);
    await this.validateOwnership(id_propriedade, userId);

    const { data, error } = await this.supabase
      .from('Lote')
      .select('*')
      .eq('id_propriedade', id_propriedade)
      .order('created_at', { ascending: false });

    if (error) {
      throw new InternalServerErrorException('Falha ao buscar os lotes da propriedade.');
    }
    // Parseia cada lote da lista
    return data.map(this.parseGeoMapa);
  }

  async findOne(id: string, user: any) {
    const userId = await this.getUserId(user);

    const { data, error } = await this.supabase
      .from('Lote')
      .select(
        `
        *,
        Propriedade(id_dono)
      `,
      )
      .eq('id_lote', id)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Lote com ID ${id} não encontrado.`);
    }

    // Verifica se o usuário é dono da propriedade
    if (data.Propriedade?.id_dono === userId) {
      delete (data as any).Propriedade;
      return this.parseGeoMapa(data);
    }

    // Se não é dono, verifica se é funcionário
    const { data: funcionarioData } = await this.supabase
      .from('UsuarioPropriedade')
      .select('id_propriedade')
      .eq('id_propriedade', data.id_propriedade)
      .eq('id_usuario', userId)
      .single();

    if (!funcionarioData) {
      throw new NotFoundException(`Lote com ID ${id} não encontrado ou não pertence a este usuário.`);
    }

    delete (data as any).Propriedade;
    return this.parseGeoMapa(data);
  }

  async update(id: string, updateLoteDto: UpdateLoteDto, user: any) {
    await this.findOne(id, user); // Valida a posse do lote que será atualizado

    // Atualização direta; geo_mapa já é objeto JSON
    const loteToUpdate: any = { ...updateLoteDto };

    // Se a propriedade estiver sendo alterada, valida a posse da nova propriedade
    if (loteToUpdate.id_propriedade) {
      const userId = await this.getUserId(user);
      await this.validateOwnership(loteToUpdate.id_propriedade, userId);
    }

    const { data, error } = await this.supabase
      .from('Lote')
      .update({
        ...loteToUpdate,
        updated_at: new Date().toISOString(),
      })
      .eq('id_lote', id)
      .select()
      .single();

    if (error) {
      throw new InternalServerErrorException('Falha ao atualizar o lote.');
    }
    return this.parseGeoMapa(data);
  }

  async remove(id: string, user: any) {
    await this.findOne(id, user); // Valida posse

    const { error } = await this.supabase.from('Lote').delete().eq('id_lote', id);

    if (error) {
      throw new InternalServerErrorException('Falha ao deletar o lote.');
    }
    return;
  }
}
