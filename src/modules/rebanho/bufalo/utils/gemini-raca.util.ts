import { Injectable } from '@nestjs/common';

export interface DadosCaracteristicasFisicas {
  cor_pelagem?: string;
  formato_chifre?: string;
  porte_corporal?: string;
  peso?: number;
  regiao_origem?: string;
  observacoes_adicionais?: string;
}

@Injectable()
export class GeminiRacaUtil {
  
  /**
   * Sugere raça de búfalo baseada em características físicas usando Gemini
   * Retorna o ID da raça encontrada no banco de dados
   */
  async sugerirRacaBufalo(caracteristicas: DadosCaracteristicasFisicas, supabase: any): Promise<number | null> {
    try {
      // TODO: Implementar integração com Gemini quando o módulo estiver disponível
      // Por enquanto, retorna null para não quebrar o sistema
      
      // const model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
      // const prompt = await this.construirPromptSugestaoRaca(caracteristicas, supabase);
      // const result = await model.generateContent(prompt);
      // const response = await result.response;
      // const racaSugerida = response.text().trim();
      
      // // Busca o ID da raça no banco baseado no nome sugerido
      // if (racaSugerida && racaSugerida !== 'Indefinida') {
      //   const { data: raca, error } = await supabase
      //     .from('Raca')
      //     .select('id_raca')
      //     .ilike('nome', racaSugerida)
      //     .single();
      //   
      //   if (!error && raca) {
      //     return raca.id_raca; // ✅ Retorna o ID da raça
      //   }
      // }
      
      return null;
    } catch (error) {
      console.error('Erro ao consultar Gemini para sugestão de raça:', error);
      return null;
    }
  }

  /**
   * Constrói prompt robusto e específico para sugestão de raça
   * Busca as raças disponíveis no banco para garantir compatibilidade
   */
  async construirPromptSugestaoRaca(caracteristicas: DadosCaracteristicasFisicas, supabase?: any): Promise<string> {
    let racasDisponiveis = 'Murrah, Mediterrâneo, Carabao, Jafarabadi';
    
    // Se tiver acesso ao supabase, busca raças reais do banco
    if (supabase) {
      try {
        const { data: racas } = await supabase
          .from('Raca')
          .select('nome')
          .order('nome');
        
        if (racas && racas.length > 0) {
          racasDisponiveis = racas.map(r => r.nome).join(', ');
        }
      } catch (error) {
        // Usa raças padrão se der erro
      }
    }

    return `
Você é um especialista em zootecnia de búfalos. Analise as características físicas abaixo e sugira APENAS UMA das seguintes raças de búfalo disponíveis no sistema:

RAÇAS DISPONÍVEIS NO BANCO:
${racasDisponiveis}

CARACTERÍSTICAS TÍPICAS:
- Murrah: Pelagem preta, chifres curvados para trás e para dentro, porte médio a grande
- Mediterrâneo: Pelagem preta ou marrom escura, chifres dirigidos para trás, porte grande
- Carabao: Pelagem cinza clara, chifres longos e curvados, porte médio
- Jafarabadi: Pelagem preta, chifres curvados em espiral, porte muito grande

CARACTERÍSTICAS DO ANIMAL:
- Cor da pelagem: ${caracteristicas.cor_pelagem || 'Não informada'}
- Formato do chifre: ${caracteristicas.formato_chifre || 'Não informado'}
- Porte corporal: ${caracteristicas.porte_corporal || 'Não informado'}
- Peso aproximado: ${caracteristicas.peso ? `${caracteristicas.peso}kg` : 'Não informado'}
- Região de origem: ${caracteristicas.regiao_origem || 'Não informada'}
- Observações: ${caracteristicas.observacoes_adicionais || 'Nenhuma'}

INSTRUÇÕES CRÍTICAS:
1. Responda APENAS com o nome EXATO da raça como está na lista de raças disponíveis
2. NÃO adicione explicações, pontuação ou texto extra
3. Se as características forem insuficientes ou contraditórias, responda "Indefinida"
4. O nome deve coincidir EXATAMENTE com uma das raças do banco de dados

RESPOSTA:`;
  }
}
