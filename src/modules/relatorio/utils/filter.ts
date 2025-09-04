import { CreateRelatorioDto } from '../dto/create-relatorio.dto';

/**
 * Define as colunas específicas a serem usadas para filtragem em cada tipo de relatório.
 */
interface TabelaFiltroOptions {
  idBufaloColumn: string; // Coluna de ID do búfalo na tabela principal do relatório
  dateColumn: string;     // Coluna de data principal para o filtro de período
}

/**
 * Aplica filtros genéricos a uma query do Supabase com base no DTO.
 * Esta função centralizada evita a repetição de código.
 *
 * @param query A instância da query do Supabase a ser modificada.
 * @param dto O DTO com os parâmetros de filtro.
 * @param options As colunas específicas da tabela a serem usadas nos filtros.
 */
export function aplicarFiltros(
  query: any,
  dto: CreateRelatorioDto,
  options: TabelaFiltroOptions,
) {
  // Filtro obrigatório por propriedade
  // Assumindo que todas as tabelas principais têm uma coluna `id_propriedade`
  query.eq('id_propriedade', dto.id_propriedade);

  // Filtro opcional por IDs de búfalos específicos
  if (dto.ids_bufalos && dto.ids_bufalos.length > 0) {
    // Usa o nome da coluna de ID do búfalo fornecido nas opções
    query.in(options.idBufaloColumn, dto.ids_bufalos);
  }

  // Filtro opcional por período (data de início)
  if (dto.data_inicio) {
    // Usa o nome da coluna de data fornecido nas opções
    query.gte(options.dateColumn, dto.data_inicio);
  }

  // Filtro opcional por período (data de fim)
  if (dto.data_fim) {
    // Usa o nome da coluna de data fornecido nas opções
    query.lte(options.dateColumn, dto.data_fim);
  }
}
