import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../../../core/supabase/supabase.service';
import { CreateDadoZootecnicoDto } from './dto/create-dado-zootecnico.dto';
import { UpdateDadoZootecnicoDto } from './dto/update-dado-zootecnico.dto';

@Injectable()
export class DadosZootecnicosService {
  constructor(private readonly supabase: SupabaseService) {}

  private readonly tableName = 'DadosZootecnicos';

  async create(dto: CreateDadoZootecnicoDto, id_bufalo: number, id_usuario: string) {
    const { data, error } = await this.supabase
      .getClient()
      .from(this.tableName)
      .insert({
        ...dto,
        id_bufalo: id_bufalo,
        id_usuario: id_usuario,
        dt_registro: dto.dt_registro || new Date(),
      })
      .select()
      .single();

    if (error) {
      throw new InternalServerErrorException(`Falha ao criar dado zootécnico: ${error.message}`);
    }
    return data;
  }

  async findAllByBufalo(id_bufalo: number) {
    const { data, error } = await this.supabase
      .getClient()
      .from(this.tableName)
      .select('*')
      .eq('id_bufalo', id_bufalo)
      .order('dt_registro', { ascending: false });

    if (error) {
      throw new InternalServerErrorException(`Falha ao buscar dados do búfalo: ${error.message}`);
    }
    return data;
  }

  async findOne(id_zootec: number) {
    const { data, error } = await this.supabase.getClient().from(this.tableName).select('*').eq('id_zootec', id_zootec).single();

    if (error || !data) {
      throw new NotFoundException(`Dado zootécnico com ID ${id_zootec} não encontrado.`);
    }
    return data;
  }

  async update(id_zootec: number, dto: UpdateDadoZootecnicoDto) {
    await this.findOne(id_zootec); // Garante que o registro existe

    const { data, error } = await this.supabase.getClient().from(this.tableName).update(dto).eq('id_zootec', id_zootec).select().single();

    if (error) {
      throw new InternalServerErrorException(`Falha ao atualizar dado zootécnico: ${error.message}`);
    }
    return data;
  }

  async remove(id_zootec: number) {
    await this.findOne(id_zootec); // Garante que o registro existe

    const { error } = await this.supabase.getClient().from(this.tableName).delete().eq('id_zootec', id_zootec);

    if (error) {
      throw new InternalServerErrorException(`Falha ao remover dado zootécnico: ${error.message}`);
    }
    return { message: 'Registro removido com sucesso' };
  }
}
