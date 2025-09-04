import { Injectable, InternalServerErrorException, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../../../core/supabase/supabase.service';
import { CreateDadosSanitariosDto } from './dto/create-dados-sanitarios.dto';
import { UpdateDadosSanitariosDto } from './dto/update-dados-sanitarios.dto';

@Injectable()
export class DadosSanitariosService {
  constructor(private readonly supabase: SupabaseService) {}

  private readonly tableName = 'DadosSanitarios';
  private readonly tableMedicacoes = 'Medicacoes';

  async create(dto: CreateDadosSanitariosDto, id_usuario: string) {
    // Validar se a medicação existe
    const { data: medicacao, error: errorMedicacao } = await this.supabase
      .getClient()
      .from(this.tableMedicacoes)
      .select('*')
      .eq('id_medicacao', dto.id_medicao)
      .single();

    if (errorMedicacao || !medicacao) {
      throw new BadRequestException('Medicação não encontrada.');
    }

    const { data, error } = await this.supabase
      .getClient()
      .from(this.tableName)
      .insert({
        ...dto,
        id_usuario: id_usuario,
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
      .select(`
        *,
        medicacao:Medicacoes!inner(id_medicacao, tipo_tratamento, medicacao, descricao)
      `)
      .order('dt_aplicacao', { ascending: false });

    if (error) {
      throw new InternalServerErrorException(`Falha ao buscar dados sanitários: ${error.message}`);
    }
    return data;
  }

  async findOne(id_sanit: number) {
    const { data, error } = await this.supabase
      .getClient()
      .from(this.tableName)
      .select(`
        *,
        medicacao:Medicacoes!inner(id_medicacao, tipo_tratamento, medicacao, descricao)
      `)
      .eq('id_sanit', id_sanit)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Dado sanitário com ID ${id_sanit} não encontrado.`);
    }
    return data;
  }

  async update(id_sanit: number, dto: UpdateDadosSanitariosDto) {
    await this.findOne(id_sanit); // Garante que o registro existe antes de atualizar

    // Se dto.id_medicao for fornecido, validar se a medicação existe
    if (dto.id_medicao) {
      const { data: medicacao, error: errorMedicacao } = await this.supabase
        .getClient()
        .from(this.tableMedicacoes)
        .select('*')
        .eq('id_medicacao', dto.id_medicao)
        .single();

      if (errorMedicacao || !medicacao) {
        throw new BadRequestException('Medicação não encontrada.');
      }
    }

    const { data, error } = await this.supabase
      .getClient()
      .from(this.tableName)
      .update(dto)
      .eq('id_sanit', id_sanit)
      .select()
      .single();

    if (error) {
      throw new InternalServerErrorException(`Falha ao atualizar dado sanitário: ${error.message}`);
    }
    return data;
  }

  async remove(id_sanit: number) {
    await this.findOne(id_sanit); // Garante que o registro existe antes de remover

    const { error } = await this.supabase
      .getClient()
      .from(this.tableName)
      .delete()
      .eq('id_sanit', id_sanit);

    if (error) {
      throw new InternalServerErrorException(`Falha ao remover dado sanitário: ${error.message}`);
    }
    return { message: 'Registro removido com sucesso' };
  }
}
