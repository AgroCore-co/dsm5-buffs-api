import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../../../core/supabase/supabase.service';
import { SupabaseClient } from '@supabase/supabase-js';
import { GenealogiaNodeDto } from './dto/genealogia-response.dto';

export interface ArvoreGenealogicaNode {
  id_bufalo: number;
  id_raca: number | null;
  categoria: string | null;
  nome?: string;
  pai?: ArvoreGenealogicaNode | null;
  mae?: ArvoreGenealogicaNode | null;
  geracao: number;
}

@Injectable()
export class GenealogiaService {
  private supabase: SupabaseClient;

  constructor(private readonly supabaseService: SupabaseService) {
    this.supabase = this.supabaseService.getClient();
  }

  public async buildTree(id: number, maxDepth: number, user: any): Promise<GenealogiaNodeDto | null> {
    try {
      // Verifica se o usuário tem acesso ao búfalo
      await this.verificarAcessoBufalo(id, user);
      
      // Constrói a árvore completa
      const arvoreCompleta = await this.construirArvoreCompleta(id, maxDepth);
      
      if (!arvoreCompleta) return null;
      
      // Converte para o formato do DTO de resposta
      return this.converterParaGenealogiaNode(arvoreCompleta);
    } catch (error) {
      if (error instanceof NotFoundException) {
        return null; 
      }
      throw error;
    }
  }

  /**
   * Verifica se o usuário tem acesso ao búfalo
   */
  private async verificarAcessoBufalo(bufaloId: number, user: any): Promise<void> {
    const userId = await this.getUserId(user);

    const { data, error } = await this.supabase
      .from('Bufalo')
      .select('*, Propriedade(id_dono)')
      .eq('id_bufalo', bufaloId)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Búfalo com ID ${bufaloId} não encontrado.`);
    }

    if (data.Propriedade?.id_dono !== userId) {
      throw new NotFoundException(`Búfalo com ID ${bufaloId} não encontrado ou não pertence a este usuário.`);
    }
  }

  /**
   * Obter ID do usuário baseado no email
   */
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
   * Constrói árvore genealógica completa com informações detalhadas
   * Usado pelo módulo de reprodução para visualização
   */
  async construirArvoreCompleta(bufaloId: number, geracoes: number = 4): Promise<any> {
    const { data: bufalo, error } = await this.supabase
      .from('Bufalo')
      .select(`
        id_bufalo, nome, brinco, sexo, dt_nascimento,
        id_pai, id_mae, id_raca, categoria,
        Raca!inner(nome)
      `)
      .eq('id_bufalo', bufaloId)
      .single();

    if (error || !bufalo) return null;

    const arvore = {
      id_bufalo: bufalo.id_bufalo,
      nome: bufalo.nome,
      brinco: bufalo.brinco,
      sexo: bufalo.sexo,
      dt_nascimento: bufalo.dt_nascimento,
      id_raca: bufalo.id_raca,
      categoria: bufalo.categoria,
      raca: (bufalo.Raca as any)?.nome,
      pai: null,
      mae: null
    };

    // Busca pai e mãe recursivamente se ainda não atingiu o limite
    if (geracoes > 1) {
      if (bufalo.id_pai) {
        arvore.pai = await this.construirArvoreCompleta(bufalo.id_pai, geracoes - 1);
      }
      if (bufalo.id_mae) {
        arvore.mae = await this.construirArvoreCompleta(bufalo.id_mae, geracoes - 1);
      }
    }

    return arvore;
  }

  /**
   * Constrói árvore genealógica simplificada para cálculo de categoria ABCB
   * Usado pelo módulo de rebanho para categorização
   */
  async construirArvoreParaCategoria(bufaloId: number, geracao: number = 1): Promise<ArvoreGenealogicaNode | null> {
    const { data: bufalo } = await this.supabase
      .from('Bufalo')
      .select('id_bufalo, id_pai, id_mae, id_raca, categoria')
      .eq('id_bufalo', bufaloId)
      .single();

    if (!bufalo) return null;

    const arvore: ArvoreGenealogicaNode = {
      id_bufalo: bufalo.id_bufalo,
      id_raca: bufalo.id_raca,
      categoria: bufalo.categoria,
      geracao,
      pai: null,
      mae: null
    };

    // Busca pai e mãe se necessário (até 4 gerações)
    if (geracao <= 4) {
      if (bufalo.id_pai) {
        arvore.pai = await this.construirArvoreParaCategoria(bufalo.id_pai, geracao + 1);
      }
      if (bufalo.id_mae) {
        arvore.mae = await this.construirArvoreParaCategoria(bufalo.id_mae, geracao + 1);
      }
    }

    return arvore;
  }

  /**
   * Verifica se um búfalo tem descendentes
   */
  async verificarSeTemDescendentes(bufaloId: number): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('Bufalo')
      .select('id_bufalo')
      .or(`id_pai.eq.${bufaloId},id_mae.eq.${bufaloId}`)
      .limit(1);

    return !error && data && data.length > 0;
  }

  /**
   * Converte árvore completa para o formato do DTO de genealogia
   */
  private converterParaGenealogiaNode(arvore: any): GenealogiaNodeDto {
    const node: GenealogiaNodeDto = {
      id: arvore.id_bufalo,
      nome: arvore.nome,
    };
    
    if (arvore.pai) {
      node.pai = this.converterParaGenealogiaNode(arvore.pai);
    }
    
    if (arvore.mae) {
      node.mae = this.converterParaGenealogiaNode(arvore.mae);
    }

    return node;
  }
}