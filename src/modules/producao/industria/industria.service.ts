import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../../../core/supabase/supabase.service';
import { CreateIndustriaDto } from './dto/create-industria.dto';
import { UpdateIndustriaDto } from './dto/update-industria.dto';

@Injectable()
export class IndustriaService {
  constructor(private readonly supabase: SupabaseService) {}

  private readonly tableName = 'Industria';

  async create(dto: CreateIndustriaDto) {
    const { data, error } = await this.supabase.getClient().from(this.tableName).insert(dto).select().single();
    if (error) throw new InternalServerErrorException('Falha ao criar indústria.');
    return data;
  }

  async findAll() {
    const { data, error } = await this.supabase.getClient().from(this.tableName).select('*').order('created_at', { ascending: false });
    if (error) throw new InternalServerErrorException('Falha ao buscar indústrias.');
    return data;
  }

  async findOne(id_industria: number) {
    const { data, error } = await this.supabase.getClient().from(this.tableName).select('*').eq('id_industria', id_industria).single();
    if (error) throw new NotFoundException('Indústria não encontrada.');
    return data;
  }

  async update(id_industria: number, dto: UpdateIndustriaDto) {
    await this.findOne(id_industria);
    const { data, error } = await this.supabase.getClient().from(this.tableName).update(dto).eq('id_industria', id_industria).select().single();
    if (error) throw new InternalServerErrorException('Falha ao atualizar indústria.');
    return data;
  }

  async remove(id_industria: number) {
    await this.findOne(id_industria);
    const { error } = await this.supabase.getClient().from(this.tableName).delete().eq('id_industria', id_industria);
    if (error) throw new InternalServerErrorException('Falha ao remover indústria.');
    return { message: 'Indústria removida com sucesso' };
  }
}


