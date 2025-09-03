import { Injectable, NotFoundException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from '../../../core/supabase/supabase.service';
import { CreateBufaloDto } from './dto/create-bufalo.dto';
import { UpdateBufaloDto } from './dto/update-bufalo.dto';
import { BufaloMaturityUtils } from './utils/maturity.utils';
import { BufaloAgeUtils } from './utils/age.utils';
import { BufaloValidationUtils } from './utils/validation.utils';
import { NivelMaturidade } from './dto/create-bufalo.dto';

// Interface para tipar as atualizações de maturidade
interface MaturityUpdate {
  id_bufalo: number;
  nivel_maturidade: NivelMaturidade;
  status: boolean;
}

@Injectable()
export class BufaloService {
  private supabase: SupabaseClient;
  private readonly tableName = 'Bufalo';

  constructor(
    private readonly supabaseService: SupabaseService
  ) {
    this.supabase = this.supabaseService.getClient();
  }

  private async getUserId(user: any): Promise<number> {
    const { data: perfilUsuario, error } = await this.supabase
      .from('Usuario')
      .select('id_usuario')
      .eq('email', user.email)
      .single();

    if (error || !perfilUsuario) {
      throw new NotFoundException('Perfil de usuário não encontrado.');
    }
    return perfilUsuario.id_usuario;
  }

  /**
   * Valida a posse da propriedade e a existência de outras referências (raça, grupo, pais).
   */
  private async validateReferencesAndOwnership(dto: CreateBufaloDto | UpdateBufaloDto, userId: number): Promise<void> {
    // 1. Validação de Posse (a mais importante)
    if (dto.id_propriedade) {
      const { data: propriedade, error } = await this.supabase
        .from('Propriedade')
        .select('id_propriedade')
        .eq('id_propriedade', dto.id_propriedade)
        .eq('id_dono', userId) // Garante que a propriedade pertence ao usuário
        .single();
      
      if (error || !propriedade) {
        throw new NotFoundException(`Propriedade com ID ${dto.id_propriedade} não encontrada ou não pertence a este usuário.`);
      }
    }

    // 2. Validação de Referências Adicionais
    const checkIfExists = async (tableName: string, columnName: string, id: number) => {
      const { data, error } = await this.supabase.from(tableName).select(columnName).eq(columnName, id).single();
      if (error || !data) {
        throw new NotFoundException(`${tableName} com ID ${id} não encontrado.`);
      }
    };

    if (dto.id_raca) await checkIfExists('Raca', 'id_raca', dto.id_raca);
    if (dto.id_grupo) await checkIfExists('Grupo', 'id_grupo', dto.id_grupo);
    if (dto.id_pai) await checkIfExists('Bufalo', 'id_bufalo', dto.id_pai);
    if (dto.id_mae) await checkIfExists('Bufalo', 'id_bufalo', dto.id_mae);
  }

  async create(createDto: CreateBufaloDto, user: any) {
    const userId = await this.getUserId(user);
    await this.validateReferencesAndOwnership(createDto, userId);

    // Processa dados com lógica de maturidade
    const processedDto = await this.processMaturityData(createDto);

    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert(processedDto)
      .select()
      .single();

    if (error) {
      if (error.code === '23503') { // Erro de chave estrangeira
        throw new BadRequestException('Falha ao criar búfalo: uma das referências (raça, grupo, etc.) é inválida.');
      }
      throw new InternalServerErrorException(`Falha ao criar o búfalo: ${error.message}`);
    }
    return data;
  }

  async findAll(user: any) {
    const userId = await this.getUserId(user);

    // Busca búfalos que estão em propriedades pertencentes ao usuário
    const { data, error } = await this.supabase
      .from('Propriedade')
      .select(`
        id_propriedade,
        nome,
        Bufalo (*)
      `)
      .eq('id_dono', userId);

    if (error) {
      throw new InternalServerErrorException('Falha ao buscar os búfalos.');
    }

    // Extrai e achata a lista de búfalos de todas as propriedades
    const allBufalos = data.flatMap(propriedade => propriedade.Bufalo || []);
    
    // Atualiza maturidade automaticamente para búfalos que precisam
    await this.updateMaturityIfNeeded(allBufalos);
    
    return allBufalos;
  }

  async findOne(id: number, user: any) {
    const userId = await this.getUserId(user);

    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*, Propriedade(id_dono)') // Puxa o id_dono da propriedade relacionada
      .eq('id_bufalo', id)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Búfalo com ID ${id} não encontrado.`);
    }

    // Verifica se a propriedade do búfalo pertence ao usuário
    if (data.Propriedade?.id_dono !== userId) {
      throw new NotFoundException(`Búfalo com ID ${id} não encontrado ou não pertence a este usuário.`);
    }
    
    // Atualiza maturidade automaticamente se necessário
    await this.updateMaturityIfNeeded([data]);
    
    delete (data as any).Propriedade; // Limpa o objeto de retorno
    return data;
  }

  async update(id: number, updateDto: UpdateBufaloDto, user: any) {
    const existingBufalo = await this.findOne(id, user); // Garante que o búfalo existe e pertence ao usuário
    
    const userId = await this.getUserId(user);
    await this.validateReferencesAndOwnership(updateDto, userId); // Valida os novos dados

    // Processa dados com lógica de maturidade
    const processedDto = await this.processMaturityData(updateDto, existingBufalo);

    const { data, error } = await this.supabase
      .from(this.tableName)
      .update(processedDto)
      .eq('id_bufalo', id)
      .select()
      .single();

    if (error) {
      throw new InternalServerErrorException(`Falha ao atualizar o búfalo: ${error.message}`);
    }
    return data;
  }

  async remove(id: number, user: any) {
    await this.findOne(id, user); // Garante que o búfalo existe e pertence ao usuário

    const { error } = await this.supabase.from(this.tableName).delete().eq('id_bufalo', id);

    if (error) {
      throw new InternalServerErrorException('Falha ao remover o búfalo.');
    }
    return;
  }

  /**
   * Processa os dados do búfalo aplicando a lógica de maturidade e validações de idade
   */
  private async processMaturityData(dto: CreateBufaloDto | UpdateBufaloDto, existingBufalo?: any): Promise<any> {
    const processedDto = { ...dto };

    // Se há data de nascimento, processa a maturidade
    if (dto.dt_nascimento) {
      const birthDate = new Date(dto.dt_nascimento);
      
      // Valida idade máxima
      if (!BufaloValidationUtils.validateMaxAge(birthDate)) {
        processedDto.status = false; // Define como inativo se idade > 50 anos
      }

      // Se não foi informado nível de maturidade, calcula automaticamente
      if (!dto.nivel_maturidade) {
        const sexo = dto.sexo || existingBufalo?.sexo;
        if (sexo) {
          // Verifica se o búfalo tem descendentes (para determinar se é vaca/touro)
          const hasOffspring = await this.checkIfHasOffspring(existingBufalo?.id_bufalo);
          processedDto.nivel_maturidade = BufaloMaturityUtils.determineMaturityLevel(
            birthDate, 
            sexo, 
            hasOffspring
          );
        }
      }
    }

    return processedDto;
  }

  /**
   * Atualiza automaticamente a maturidade de búfalos quando necessário
   * Este método é chamado automaticamente em findAll e findOne
   */
  private async updateMaturityIfNeeded(bufalos: any[]): Promise<void> {
    if (!bufalos || bufalos.length === 0) return;

    const updates: MaturityUpdate[] = []; // Tipagem explícita do array

    for (const bufalo of bufalos) {
      if (bufalo.dt_nascimento && bufalo.sexo) {
        const birthDate = new Date(bufalo.dt_nascimento);
        const hasOffspring = await this.checkIfHasOffspring(bufalo.id_bufalo);
        
        const newMaturityLevel = BufaloMaturityUtils.determineMaturityLevel(
          birthDate, 
          bufalo.sexo, 
          hasOffspring
        );
        
        const shouldBeInactive = BufaloValidationUtils.validateMaxAge(birthDate) === false;
        
        // Só atualiza se houve mudança
        if (newMaturityLevel !== bufalo.nivel_maturidade || 
            (shouldBeInactive && bufalo.status !== false)) {
          updates.push({
            id_bufalo: bufalo.id_bufalo,
            nivel_maturidade: newMaturityLevel,
            status: shouldBeInactive ? false : bufalo.status
          });
        }
      }
    }
    
    // Executa atualizações em lote se necessário
    if (updates.length > 0) {
      console.log(`Atualizando maturidade de ${updates.length} búfalo(s)...`);
      
      for (const update of updates) {
        await this.supabase
          .from(this.tableName)
          .update({
            nivel_maturidade: update.nivel_maturidade,
            status: update.status
          })
          .eq('id_bufalo', update.id_bufalo);
      }
      
      console.log(`Maturidade atualizada para ${updates.length} búfalo(s)`);
    }
  }

  /**
   * Verifica se um búfalo tem descendentes
   */
  private async checkIfHasOffspring(bufaloId?: number): Promise<boolean> {
    if (!bufaloId) return false;

    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('id_bufalo')
      .or(`id_pai.eq.${bufaloId},id_mae.eq.${bufaloId}`)
      .limit(1);

    return !error && data && data.length > 0;
  }
}