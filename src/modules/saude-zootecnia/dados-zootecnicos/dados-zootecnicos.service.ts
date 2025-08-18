import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from 'src/core/supabase/supabase.service';
import { CreateDadoZootecnicoDto } from './dto/create-dado-zootecnico.dto';
import { UpdateDadoZootecnicoDto } from './dto/update-dado-zootecnico.dto';

const TABLE_NAME = 'DadosZootecnicos';

@Injectable()
export class DadosZootecnicosService {
  constructor(private readonly supabase: SupabaseService) {}

  async create(createDto: CreateDadoZootecnicoDto, id_bufalo: number, id_usuario: number) {
    const { data, error } = await this.supabase
      .getClient()
      .from(TABLE_NAME)
      .insert({
        ...createDto,
        id_bufalo: id_bufalo,
        id_usuario: id_usuario,
        dt_registro: createDto.dt_registro || new Date(),
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async findAllByBufalo(id_bufalo: number) {
    const { data, error } = await this.supabase.getClient().from(TABLE_NAME).select('*').eq('id_bufalo', id_bufalo);

    if (error) throw new Error(error.message);
    return data;
  }

  async findOne(id_zootec: number) {
    const { data, error } = await this.supabase.getClient().from(TABLE_NAME).select('*').eq('id_zootec', id_zootec).single();

    if (error) throw new NotFoundException('Registro não encontrado');
    return data;
  }

  async update(id_zootec: number, updateDto: UpdateDadoZootecnicoDto) {
    const { data, error } = await this.supabase.getClient().from(TABLE_NAME).update(updateDto).eq('id_zootec', id_zootec).select().single();

    if (error) throw new Error(error.message);
    return data;
  }

  async remove(id_zootec: number) {
    const { error } = await this.supabase.getClient().from(TABLE_NAME).delete().eq('id_zootec', id_zootec);

    if (error) throw new Error(error.message);
    return { message: 'Registro removido com sucesso' };
  }
}
