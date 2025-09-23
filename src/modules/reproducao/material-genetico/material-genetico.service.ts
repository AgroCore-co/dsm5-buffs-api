import { Injectable, InternalServerErrorException, NotFoundException, Logger } from '@nestjs/common';
import { SupabaseService } from '../../../core/supabase/supabase.service';
import { CreateMaterialGeneticoDto } from './dto/create-material-genetico.dto';
import { UpdateMaterialGeneticoDto } from './dto/update-material-genetico.dto';

@Injectable()
export class MaterialGeneticoService {
  private readonly logger = new Logger(MaterialGeneticoService.name);
  
  constructor(private readonly supabase: SupabaseService) {}

  private readonly tableName = 'MaterialGenetico';

  async create(dto: CreateMaterialGeneticoDto) {
    const { data, error } = await this.supabase.getClient().from(this.tableName).insert(dto).select().single();

    if (error) {
      throw new InternalServerErrorException(`Falha ao criar material genético: ${error.message}`);
    }
    return data;
  }

  async findAll() {
    this.logger.log('[INICIO] Buscando todos os materiais genéticos');
    
    try {
      const { data, error } = await this.supabase
        .getClient()
        .from(this.tableName)
        .select(`
          *,
          raca:id_raca(
            id_raca,
            nome_raca
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        this.logger.error(`[ERRO] Falha na consulta: ${error.message}`);
        throw new InternalServerErrorException(`Erro ao buscar material genético: ${error.message}`);
      }

      this.logger.log(`[SUCESSO] ${data?.length || 0} materiais genéticos encontrados`);

      return {
        message: 'Material genético recuperado com sucesso',
        total: data?.length || 0,
        dados: data || []
      };
    } catch (error) {
      this.logger.error(`[ERRO_GERAL] ${error.message}`);
      throw new InternalServerErrorException(`Erro ao buscar material genético: ${error.message}`);
    }
  }

  async findOne(id_material: number) {
    const { data, error } = await this.supabase
      .getClient()
      .from(this.tableName)
      .select('*, bufalo_origem:Bufalo(id_bufalo, nome, brinco)')
      .eq('id_material', id_material)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Material genético com ID ${id_material} não encontrado.`);
    }
    return data;
  }

  async update(id_material: number, dto: UpdateMaterialGeneticoDto) {
    await this.findOne(id_material);

    const { data, error } = await this.supabase.getClient().from(this.tableName).update(dto).eq('id_material', id_material).select().single();

    if (error) {
      throw new InternalServerErrorException(`Falha ao atualizar material genético: ${error.message}`);
    }
    return data;
  }

  async remove(id_material: number) {
    await this.findOne(id_material);

    const { error } = await this.supabase.getClient().from(this.tableName).delete().eq('id_material', id_material);

    if (error) {
      throw new InternalServerErrorException(`Falha ao remover material genético: ${error.message}`);
    }
    return { message: 'Registro removido com sucesso' };
  }
}
