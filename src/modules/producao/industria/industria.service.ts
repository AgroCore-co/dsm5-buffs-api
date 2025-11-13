import { Injectable, InternalServerErrorException, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../../../core/supabase/supabase.service';
import { LoggerService } from '../../../core/logger/logger.service';
import { CreateIndustriaDto } from './dto/create-industria.dto';
import { UpdateIndustriaDto } from './dto/update-industria.dto';
import { formatDateFields, formatDateFieldsArray } from '../../../core/utils/date-formatter.utils';
import { ISoftDelete } from '../../../core/interfaces';

@Injectable()
export class IndustriaService implements ISoftDelete {
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
    return formatDateFields(data);
  }

  async findAll() {
    this.logger.log('Iniciando busca de todas as indústrias', {
      module: 'IndustriaService',
      method: 'findAll',
    });

    const { data, error } = await this.supabase
      .getAdminClient()
      .from(this.tableName)
      .select('*')
      .is('deleted_at', null)
      .order('nome', { ascending: true });

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
    return formatDateFieldsArray(data);
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
      .is('deleted_at', null)
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
    return formatDateFieldsArray(data);
  }

  async findOne(id_industria: string) {
    this.logger.log('Iniciando busca de indústria por ID', {
      module: 'IndustriaService',
      method: 'findOne',
      industriaId: id_industria,
    });

    const { data, error } = await this.supabase
      .getAdminClient()
      .from(this.tableName)
      .select('*')
      .eq('id_industria', id_industria)
      .is('deleted_at', null)
      .single();

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
    return formatDateFields(data);
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
    return formatDateFields(data);
  }

  async remove(id_industria: string) {
    return this.softDelete(id_industria);
  }

  async softDelete(id: string) {
    this.logger.log('Iniciando remoção de indústria (soft delete)', {
      module: 'IndustriaService',
      method: 'softDelete',
      industriaId: id,
    });

    await this.findOne(id);

    const { data, error } = await this.supabase
      .getAdminClient()
      .from(this.tableName)
      .update({ deleted_at: new Date().toISOString() })
      .eq('id_industria', id)
      .select()
      .single();

    if (error) {
      this.logger.logError(error, {
        module: 'IndustriaService',
        method: 'softDelete',
        industriaId: id,
      });
      throw new InternalServerErrorException(`Falha ao remover indústria: ${error.message}`);
    }

    this.logger.log('Indústria removida com sucesso (soft delete)', {
      module: 'IndustriaService',
      method: 'softDelete',
      industriaId: id,
    });

    return {
      message: 'Indústria removida com sucesso (soft delete)',
      data: formatDateFields(data),
    };
  }

  async restore(id: string) {
    this.logger.log('Iniciando restauração de indústria', {
      module: 'IndustriaService',
      method: 'restore',
      industriaId: id,
    });

    const { data: industria } = await this.supabase.getAdminClient().from(this.tableName).select('deleted_at').eq('id_industria', id).single();

    if (!industria) {
      throw new NotFoundException(`Indústria com ID ${id} não encontrada`);
    }

    if (!industria.deleted_at) {
      throw new BadRequestException('Esta indústria não está removida');
    }

    const { data, error } = await this.supabase
      .getAdminClient()
      .from(this.tableName)
      .update({ deleted_at: null })
      .eq('id_industria', id)
      .select()
      .single();

    if (error) {
      this.logger.logError(error, {
        module: 'IndustriaService',
        method: 'restore',
        industriaId: id,
      });
      throw new InternalServerErrorException(`Falha ao restaurar indústria: ${error.message}`);
    }

    this.logger.log('Indústria restaurada com sucesso', {
      module: 'IndustriaService',
      method: 'restore',
      industriaId: id,
    });

    return {
      message: 'Indústria restaurada com sucesso',
      data: formatDateFields(data),
    };
  }

  async findAllWithDeleted(): Promise<any[]> {
    this.logger.log('Buscando todas as indústrias incluindo deletadas', {
      module: 'IndustriaService',
      method: 'findAllWithDeleted',
    });

    const { data, error } = await this.supabase
      .getAdminClient()
      .from(this.tableName)
      .select('*')
      .order('deleted_at', { ascending: false, nullsFirst: true })
      .order('nome', { ascending: true });

    if (error) {
      this.logger.logError(error, {
        module: 'IndustriaService',
        method: 'findAllWithDeleted',
      });
      throw new InternalServerErrorException('Erro ao buscar indústrias (incluindo deletadas)');
    }

    return formatDateFieldsArray(data || []);
  }
}
