import { Injectable, NotFoundException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from '../../../core/supabase/supabase.service';
import { CreateBufaloDto } from './dto/create-bufalo.dto';
import { UpdateBufaloDto } from './dto/update-bufalo.dto';
import { BufaloMaturityUtils } from './utils/maturity.utils';
import { BufaloAgeUtils } from './utils/age.utils';
import { BufaloValidationUtils } from './utils/validation.utils';
import { NivelMaturidade } from './dto/create-bufalo.dto';
import { CategoriaABCBUtil } from './utils/categoria-abcb.util';
import { GeminiRacaUtil } from './utils/gemini-raca.util';
import { CategoriaABCB } from './dto/categoria-abcb.dto';
import { GenealogiaService } from '../../reproducao/genealogia/genealogia.service';

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
    private readonly supabaseService: SupabaseService,
    private readonly geminiRacaUtil: GeminiRacaUtil,
    private readonly genealogiaService: GenealogiaService
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
    console.log('BufaloService.create - Iniciando criação de búfalo:', createDto);
    console.log('BufaloService.create - User:', user);
    
    const userId = await this.getUserId(user);
    console.log('BufaloService.create - UserId obtido:', userId);
    
    await this.validateReferencesAndOwnership(createDto, userId);
    console.log('BufaloService.create - Validações passaram');

    // Processa dados com lógica de maturidade
    const processedDto = await this.processMaturityData(createDto);
    console.log('BufaloService.create - Dados processados:', processedDto);

    console.log('BufaloService.create - Inserindo no banco de dados...');
    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert(processedDto)
      .select()
      .single();

    if (error) {
      console.error('BufaloService.create - Erro ao inserir:', error);
      if (error.code === '23503') { // Erro de chave estrangeira
        throw new BadRequestException('Falha ao criar búfalo: uma das referências (raça, grupo, etc.) é inválida.');
      }
      throw new InternalServerErrorException(`Falha ao criar o búfalo: ${error.message}`);
    }

    console.log('BufaloService.create - Búfalo criado com sucesso:', data);

    // Processa categoria ABCB em background
    if (data?.id_bufalo) {
      setTimeout(async () => {
        try {
          await this.processarCategoriaABCB(data.id_bufalo);
        } catch (error) {
          console.error('Erro ao processar categoria ABCB em background:', error);
        }
      }, 1000);
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

    // Processa categoria ABCB em background
    setTimeout(async () => {
      try {
        await this.processarCategoriaABCB(id);
      } catch (error) {
        console.error('Erro ao processar categoria ABCB em background:', error);
      }
    }, 1000);

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
    return this.genealogiaService.verificarSeTemDescendentes(bufaloId);
  }

  /**
   * Processa categoria ABCB do búfalo após criação/atualização
   */
  async processarCategoriaABCB(bufaloId: number): Promise<CategoriaABCB | null> {
    try {
      console.log(`Iniciando processamento da categoria ABCB para búfalo ${bufaloId}`);
      
      const bufalo = await this.buscarBufaloCompleto(bufaloId);
      if (!bufalo) {
        console.warn(`Búfalo ${bufaloId} não encontrado para processamento de categoria`);
        return null;
      }

      console.log(`Búfalo encontrado: ${bufalo.nome}, Raça: ${bufalo.id_raca}, Propriedade ABCB: ${bufalo.Propriedade?.p_abcb}`);

      // Se não tem raça definida, tenta sugerir com Gemini
      if (!bufalo.id_raca) {
        console.log(`Tentando sugerir raça com Gemini para ${bufalo.nome}...`);
        try {
          await this.tentarSugerirRaca(bufalo);
          // Recarrega búfalo após possível atualização de raça
          const bufaloAtualizado = await this.buscarBufaloCompleto(bufaloId);
          if (bufaloAtualizado) {
            Object.assign(bufalo, bufaloAtualizado);
            console.log(`Búfalo atualizado, nova raça: ${bufalo.id_raca}`);
          }
        } catch (error) {
          console.warn(`Falha ao sugerir raça para ${bufalo.nome}:`, error.message);
          // Continua o processamento mesmo sem raça
        }
      }

      // Constrói árvore genealógica usando serviço compartilhado
      console.log(`Construindo árvore genealógica para ${bufalo.nome}...`);
      const arvore = await this.genealogiaService.construirArvoreParaCategoria(bufaloId, 1);
      
      if (!arvore) {
        console.warn(`Não foi possível construir a árvore genealógica para ${bufalo.nome}`);
        return null;
      }
      
      console.log(`Árvore genealógica construída com sucesso para ${bufalo.nome}`);
      
      // Calcula categoria
      console.log(`Calculando categoria ABCB para ${bufalo.nome}...`);
      console.log(`Parâmetros: propriedadeABCB=${bufalo.Propriedade.p_abcb}, temRaca=${Boolean(bufalo.id_raca)}`);
      
      const categoria = CategoriaABCBUtil.calcularCategoria(
        arvore,
        bufalo.Propriedade.p_abcb,
        Boolean(bufalo.id_raca)
      );

      console.log(`Categoria calculada para ${bufalo.nome}: ${categoria}`);

      // Atualiza categoria no banco
      const { error } = await this.supabase
        .from(this.tableName)
        .update({ categoria })
        .eq('id_bufalo', bufaloId);

      if (error) {
        console.error(`Erro ao salvar categoria ${categoria} para ${bufalo.nome}:`, error);
        throw new InternalServerErrorException(`Falha ao salvar categoria ABCB: ${error.message}`);
      }

      console.log(`Categoria ${categoria} salva com sucesso para ${bufalo.nome}`);
      return categoria;

    } catch (error) {
      console.error(`Erro no processamento da categoria ABCB para búfalo ${bufaloId}:`, error);
      
      if (error instanceof InternalServerErrorException) {
        throw error; // Re-throw erros já tratados
      }
      
      // Para outros erros, logga e retorna null
      return null;
    }
  }

  /**
   * Tenta sugerir raça usando Gemini baseado em características físicas
   */
  private async tentarSugerirRaca(bufalo: any): Promise<void> {
    try {
      // Busca dados zootécnicos mais recentes
      const { data: dadosZootecnicos, error: errorZootec } = await this.supabase
        .from('DadosZootecnicos')
        .select('*')
        .eq('id_bufalo', bufalo.id_bufalo)
        .order('dt_registro', { ascending: false })
        .limit(1)
        .single();

      if (errorZootec || !dadosZootecnicos) {
        console.warn(`Dados zootécnicos não encontrados para ${bufalo.nome}, pulando sugestão de raça`);
        return;
      }

      const caracteristicas = {
        cor_pelagem: dadosZootecnicos.cor_pelagem,
        formato_chifre: dadosZootecnicos.formato_chifre,
        porte_corporal: dadosZootecnicos.porte_corporal,
        peso: dadosZootecnicos.peso,
        regiao_origem: bufalo.Propriedade?.Endereco?.estado,
      };

      console.log(`Solicitando sugestão de raça para ${bufalo.nome} via Gemini...`);
      const idRacaSugerida = await this.geminiRacaUtil.sugerirRacaBufalo(caracteristicas, this.supabase);
      
      if (idRacaSugerida) {
        const { error: errorUpdate } = await this.supabase
          .from(this.tableName)
          .update({ id_raca: idRacaSugerida })
          .eq('id_bufalo', bufalo.id_bufalo);

        if (errorUpdate) {
          console.error(`Erro ao atualizar raça sugerida para ${bufalo.nome}:`, errorUpdate);
          throw new InternalServerErrorException(`Falha ao salvar raça sugerida: ${errorUpdate.message}`);
        }

        console.log(`Raça ${idRacaSugerida} sugerida e salva para ${bufalo.nome}`);
      } else {
        console.warn(`Gemini não conseguiu sugerir uma raça para ${bufalo.nome}`);
      }

    } catch (error) {
      console.error(`Erro ao tentar sugerir raça para ${bufalo.nome}:`, error);
      throw error; // Re-throw para que o caller possa tratar
    }
  }

  /**
   * Busca búfalo com dados completos
   */
  private async buscarBufaloCompleto(bufaloId: number): Promise<any> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select(`
          *,
          Propriedade!inner (
            p_abcb,
            Endereco (estado)
          )
        `)
        .eq('id_bufalo', bufaloId)
        .single();

      if (error) {
        console.error(`Erro ao buscar dados completos do búfalo ${bufaloId}:`, error);
        throw new InternalServerErrorException(`Falha ao buscar dados do búfalo: ${error.message}`);
      }

      return data;

    } catch (error) {
      console.error(`Erro ao buscar búfalo completo ${bufaloId}:`, error);
      
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      
      return null;
    }
  }

  /**
   * Busca búfalos por categoria
   */
  async findByCategoria(categoria: CategoriaABCB, user: any) {
    const userId = await this.getUserId(user);

    const { data, error } = await this.supabase
      .from('Propriedade')
      .select(`
        id_propriedade,
        nome,
        Bufalo!inner (
          *,
          Raca (nome)
        )
      `)
      .eq('id_dono', userId)
      .eq('Bufalo.categoria', categoria)
      .eq('Bufalo.status', true);

    if (error) {
      throw new InternalServerErrorException(`Falha ao buscar búfalos da categoria ${categoria}.`);
    }

    return data.flatMap(propriedade => 
      propriedade.Bufalo.map(bufalo => ({
        ...bufalo,
        propriedade: propriedade.nome
      }))
    );
  }
}