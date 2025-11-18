/**
 * Mappers para transformação de dados de cobertura.
 * Centraliza toda lógica de formatação e transformação de dados.
 */

/**
 * Mapeia dados de cobertura do banco para o formato de resposta da API.
 * Extrai dados dos animais (macho e fêmea) e move para o nível raiz.
 *
 * @param item Dados brutos do banco com joins
 * @returns Dados formatados para a API
 */
export function mapCoberturaResponse(item: any): any {
  return {
    ...item,
    nome_femea: item.femea?.nome || null,
    brinco_femea: item.femea?.brinco || null,
    microchip_femea: item.femea?.microchip || null,
    nome_macho: item.macho?.nome || null,
    brinco_macho: item.macho?.brinco || null,
    microchip_macho: item.macho?.microchip || null,
    // Remover os objetos aninhados para manter a resposta limpa
    femea: undefined,
    macho: undefined,
  };
}

/**
 * Mapeia array de coberturas.
 *
 * @param items Array de dados brutos do banco
 * @returns Array de dados formatados
 */
export function mapCoberturasResponse(items: any[]): any[] {
  return items.map(mapCoberturaResponse);
}
