import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../../../core/supabase/supabase.service';
import { LoggerService } from '../../../core/logger/logger.service';
import { CreateIndustriaDto } from './dto/create-industria.dto';
import { UpdateIndustriaDto } from './dto/update-industria.dto';

@Injectable()
export class IndustriaService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly logger: LoggerService,
  ) {}

  private readonly tableName = 'industria';

  async create(dto: CreateIndustriaDto) {
    this.logger.log('Iniciando criação de indústria', {
      module: 'IndustriaService',
      method: 'create',
      nome: dto.nome,
    });

    const { data, error } = await this.supabase.getAdminClient().from(this.tableName).insert(dto).select().single();
    if (error) {
      this.logger.logError(error, {
        module: 'IndustriaService',
        method: 'create',
        nome: dto.nome,
      });
      throw new InternalServerErrorException(`Falha ao criar indústria: ${error.message}`);
    }

    this.logger.log('Indústria criada com sucesso', {
      module: 'IndustriaService',
      method: 'create',
      industriaId: data.id_industria,
      nome: dto.nome,
    });
    return data;
  }

  async findAll() {
    this.logger.log('Iniciando busca de todas as indústrias', {
      module: 'IndustriaService',
      method: 'findAll',
    });

    const { data, error } = await this.supabase.getAdminClient().from(this.tableName).select('*').order('nome', { ascending: true });
    if (error) {
      this.logger.logError(error, {
        module: 'IndustriaService',
        method: 'findAll',
      });
      throw new InternalServerErrorException(`Falha ao buscar indústrias: ${error.message}`);
    }

    this.logger.log(`Busca de indústrias concluída - ${data.length} indústrias encontradas`, {
      module: 'IndustriaService',
      method: 'findAll',
    });
    return data;
  }

  async findByPropriedade(id_propriedade: string) {
    this.logger.log('Iniciando busca de indústrias por propriedade', {
      module: 'IndustriaService',
      method: 'findByPropriedade',
      propriedadeId: id_propriedade,
    });

    const { data, error } = await this.supabase
      .getAdminClient()
      .from(this.tableName)
      .select('*')
      .eq('id_propriedade', id_propriedade)
      .order('nome', { ascending: true });

    if (error) {
      this.logger.logError(error, {
        module: 'IndustriaService',
        method: 'findByPropriedade',
        propriedadeId: id_propriedade,
      });
      throw new InternalServerErrorException(`Falha ao buscar indústrias da propriedade: ${error.message}`);
    }

    this.logger.log(`Busca concluída - ${data.length} indústrias encontradas para a propriedade`, {
      module: 'IndustriaService',
      method: 'findByPropriedade',
      propriedadeId: id_propriedade,
    });
    return data;
  }

  async findOne(id_industria: string) {
    this.logger.log('Iniciando busca de indústria por ID', {
      module: 'IndustriaService',
      method: 'findOne',
      industriaId: id_industria,
    });

    const { data, error } = await this.supabase.getAdminClient().from(this.tableName).select('*').eq('id_industria', id_industria).single();
    if (error || !data) {
      this.logger.warn('Indústria não encontrada', {
        module: 'IndustriaService',
        method: 'findOne',
        industriaId: id_industria,
      });
      throw new NotFoundException(`Indústria com ID ${id_industria} não encontrada.`);
    }

    this.logger.log('Indústria encontrada com sucesso', {
      module: 'IndustriaService',
      method: 'findOne',
      industriaId: id_industria,
    });
    return data;
  }

  async update(id_industria: string, dto: UpdateIndustriaDto) {
    this.logger.log('Iniciando atualização de indústria', {
      module: 'IndustriaService',
      method: 'update',
      industriaId: id_industria,
    });

    await this.findOne(id_industria);
    const { data, error } = await this.supabase.getAdminClient().from(this.tableName).update(dto).eq('id_industria', id_industria).select().single();
    if (error) {
      this.logger.logError(error, {
        module: 'IndustriaService',
        method: 'update',
        industriaId: id_industria,
      });
      throw new InternalServerErrorException(`Falha ao atualizar indústria: ${error.message}`);
    }

    this.logger.log('Indústria atualizada com sucesso', {
      module: 'IndustriaService',
      method: 'update',
      industriaId: id_industria,
    });
    return data;
  }

  async remove(id_industria: string) {
    this.logger.log('Iniciando remoção de indústria', {
      module: 'IndustriaService',
      method: 'remove',
      industriaId: id_industria,
    });

    await this.findOne(id_industria);
    const { error } = await this.supabase.getAdminClient().from(this.tableName).delete().eq('id_industria', id_industria);
    if (error) {
      this.logger.logError(error, {
        module: 'IndustriaService',
        method: 'remove',
        industriaId: id_industria,
      });
      throw new InternalServerErrorException(`Falha ao remover indústria: ${error.message}`);
    }

    this.logger.log('Indústria removida com sucesso', {
      module: 'IndustriaService',
      method: 'remove',
      industriaId: id_industria,
    });
    return { message: 'Indústria removida com sucesso' };
  }
}
