import { StringSimilarityUtil } from '../../../../core/utils/string-similarity.utils';

/**
 * Utilitário para normalizar nomes de doenças
 * Mapeia variações e erros de digitação para o nome correto
 */
export class DoencaNormalizerUtil {
  /**
   * Dicionário de doenças conhecidas (nome correto)
   * Adicione aqui as doenças mais comuns do sistema
   * O algoritmo de similaridade vai corrigir automaticamente variações como:
   * - "vverminose" → "verminose"
   * - "mastiti" → "mastite"
   * - "diareia" → "diarreia"
   */
  private static readonly DOENCAS_CONHECIDAS = [
    'verminose',
    'mastite',
    'diarreia',
    'febre aftosa',
    'brucelose',
    'tuberculose',
    'leptospirose',
    'raiva',
    'carbunculo',
    'pneumonia',
    'enterite',
    'conjuntivite',
    'dermatite',
    'clostridiose',
    'babesiose',
    'anaplasmose',
    'tripanossomiase',
    'salmonelose',
    'coccidiose',
    'haemoncose',
    'tristeza parasitaria',
    'rinotraqueite',
    'paratuberculose',
    'botulismo',
  ];

  /**
   * Normaliza o nome da doença
   * 1. Remove espaços extras, acentos e converte para lowercase
   * 2. Tenta encontrar doença similar no dicionário
   * 3. Se não encontrar, retorna a versão normalizada básica
   */
  static normalize(doenca: string | undefined, limiarSimilaridade = 0.85): string | undefined {
    if (!doenca) return undefined;

    // 1. Normalização básica
    const doencaNormalizada = doenca
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, ''); // Remove acentos

    // 2. Busca por similaridade no dicionário de doenças conhecidas
    const doencaSimilar = this.DOENCAS_CONHECIDAS.find((doencaConhecida) =>
      StringSimilarityUtil.areSimilar(doencaNormalizada, doencaConhecida, limiarSimilaridade),
    );

    if (doencaSimilar) {
      return doencaSimilar;
    }

    // 3. Se não encontrou correspondência, retorna a versão normalizada
    return doencaNormalizada;
  }

  /**
   * Retorna sugestões de doenças similares
   * Útil para autocomplete no frontend
   */
  static getSugestoes(termo: string, limit = 5, limiarSimilaridade = 0.5): string[] {
    if (!termo) return this.DOENCAS_CONHECIDAS.slice(0, limit);

    const termoNormalizado = termo.toLowerCase().trim();

    // Busca por doenças que começam com o termo
    const exatas = this.DOENCAS_CONHECIDAS.filter((d) => d.startsWith(termoNormalizado));

    // Busca por doenças similares
    const similares = this.DOENCAS_CONHECIDAS.filter((d) => !exatas.includes(d))
      .map((doenca) => ({
        doenca,
        similaridade: 1 - StringSimilarityUtil.levenshteinDistance(termoNormalizado, doenca) / Math.max(termoNormalizado.length, doenca.length),
      }))
      .filter((item) => item.similaridade >= limiarSimilaridade)
      .sort((a, b) => b.similaridade - a.similaridade)
      .map((item) => item.doenca);

    // Combina exatas + similares
    const resultado = [...exatas, ...similares].slice(0, limit);

    // Se não encontrou nenhuma, retorna as mais comuns
    return resultado.length > 0 ? resultado : this.DOENCAS_CONHECIDAS.slice(0, limit);
  }

  /**
   * Retorna todas as doenças conhecidas
   */
  static getDoencasConhecidas(): string[] {
    return [...this.DOENCAS_CONHECIDAS];
  }

  /**
   * Adiciona uma nova doença ao dicionário (runtime)
   * Útil para aprender com novos dados
   */
  static adicionarDoenca(doenca: string): void {
    const normalizada = doenca.toLowerCase().trim();
    if (!this.DOENCAS_CONHECIDAS.includes(normalizada)) {
      this.DOENCAS_CONHECIDAS.push(normalizada);
    }
  }
}
