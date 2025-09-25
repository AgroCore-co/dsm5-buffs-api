import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../../../core/supabase/supabase.service';
import { LoggerService } from '../../../core/logger/logger.service';
import { CreateColetaDto } from './dto/create-coleta.dto';
import { UpdateColetaDto } from './dto/update-coleta.dto';

@Injectable()
export class ColetaService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly logger: LoggerService,
  ) {}

  private readonly tableName = 'Coleta';

  async create(dto: CreateColetaDto, id_funcionario: string) {
    this.logger.log('Iniciando criação de coleta', { 
      module: 'ColetaService', 
      method: 'create',
      funcionarioId: id_funcionario,
      industriaId: dto.id_industria
    });
    
    const { data, error } = await this.supabase
      .getClient()
      .from(this.tableName)
      .insert({
        ...dto,
        id_funcionario: id_funcionario,
      })
      .select()
      .single();

    if (error) {
      this.logger.logError(error, { 
        module: 'ColetaService', 
        method: 'create',
        funcionarioId: id_funcionario
      });
      throw new InternalServerErrorException(`Falha ao criar coleta: ${error.message}`);
    }
    
    this.logger.log('Coleta criada com sucesso', { 
      module: 'ColetaService', 
      method: 'create',
      coletaId: data.id_coleta,
      funcionarioId: id_funcionario
    });
    return data;
  }

  async findAll() {
    this.logger.log('Iniciando busca de todas as coletas', { 
      module: 'ColetaService', 
      method: 'findAll'
    });
    
    const { data, error } = await this.supabase
      .getClient()
      .from(this.tableName)
      .select('*, industria:Industria(nome), funcionario:Usuario(nome)')
      .order('dt_coleta', { ascending: false });

    if (error) {
      this.logger.logError(error, { 
        module: 'ColetaService', 
        method: 'findAll'
      });
      throw new InternalServerErrorException(`Falha ao buscar coletas: ${error.message}`);
    }
    
    this.logger.log(`Busca de coletas concluída - ${data.length} coletas encontradas`, { 
      module: 'ColetaService', 
      method: 'findAll'
    });
    return data;
  }

  async findOne(id_coleta: number) {
    this.logger.log('Iniciando busca de coleta por ID', { 
      module: 'ColetaService', 
      method: 'findOne',
      coletaId: id_coleta
    });
    
    const { data, error } = await this.supabase
      .getClient()
      .from(this.tableName)
      .select('*, industria:Industria(nome, representante), funcionario:Usuario(nome, cargo)')
      .eq('id_coleta', id_coleta)
      .single();

    if (error || !data) {
      this.logger.warn('Coleta não encontrada', { 
        module: 'ColetaService', 
        method: 'findOne',
        coletaId: id_coleta
      });
      throw new NotFoundException(`Coleta com ID ${id_coleta} não encontrada.`);
    }
    
    this.logger.log('Coleta encontrada com sucesso', { 
      module: 'ColetaService', 
      method: 'findOne',
      coletaId: id_coleta
    });
    return data;
  }

  async update(id_coleta: number, dto: UpdateColetaDto) {
    this.logger.log('Iniciando atualização de coleta', { 
      module: 'ColetaService', 
      method: 'update',
      coletaId: id_coleta
    });
    
    await this.findOne(id_coleta);

    const { data, error } = await this.supabase.getClient().from(this.tableName).update(dto).eq('id_coleta', id_coleta).select().single();

    if (error) {
      this.logger.logError(error, { 
        module: 'ColetaService', 
        method: 'update',
        coletaId: id_coleta
      });
      throw new InternalServerErrorException(`Falha ao atualizar coleta: ${error.message}`);
    }
    
    this.logger.log('Coleta atualizada com sucesso', { 
      module: 'ColetaService', 
      method: 'update',
      coletaId: id_coleta
    });
    return data;
  }

  async remove(id_coleta: number) {
    this.logger.log('Iniciando remoção de coleta', { 
      module: 'ColetaService', 
      method: 'remove',
      coletaId: id_coleta
    });
    
    await this.findOne(id_coleta);

    const { error } = await this.supabase.getClient().from(this.tableName).delete().eq('id_coleta', id_coleta);

    if (error) {
      this.logger.logError(error, { 
        module: 'ColetaService', 
        method: 'remove',
        coletaId: id_coleta
      });
      throw new InternalServerErrorException(`Falha ao remover coleta: ${error.message}`);
    }
    
    this.logger.log('Coleta removida com sucesso', { 
      module: 'ColetaService', 
      method: 'remove',
      coletaId: id_coleta
    });
    return { message: 'Coleta removida com sucesso' };
  }
}
