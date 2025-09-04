import { CreateRelatorioDto } from '../dto/create-relatorio.dto';

/**
 * Interface para definir os nomes das colunas que serão usadas nos filtros.
 * Isso torna a função genérica e reutilizável para diferentes tabelas.
 */
export interface TabelaFiltroOptions {
  idPropriedade?: string; // Nome da coluna de ID da propriedade (ex: 'id_propriedade')
  idBufalo?: string;      // Nome da coluna de ID do búfalo (ex: 'id_bufalo', 'id_bufala')
  data?: string;          // Nome da coluna de data para o filtro de período (ex: 'dt_nascimento')
}

/**
 * Aplica filtros comuns a uma query do Supabase de forma genérica.
 * @param query A instância da query do Supabase.
 * @param dto O DTO com os dados do filtro vindos da requisição.
 * @param options Um objeto que mapeia os filtros para os nomes de coluna corretos na tabela.
 */
export function aplicarFiltros(
  query: any,
  dto: CreateRelatorioDto,
  options: TabelaFiltroOptions,
) {
  // Filtro obrigatório de propriedade
  const colunaPropriedade = options.idPropriedade || 'id_propriedade';
  query.eq(colunaPropriedade, dto.id_propriedade);

  // Filtro opcional por IDs de búfalos
  if (dto.ids_bufalos && dto.ids_bufalos.length > 0 && options.idBufalo) {
    query.in(options.idBufalo, dto.ids_bufalos);
  }

  // Filtro opcional por período (data de início)
  if (dto.data_inicio && options.data) {
    query.gte(options.data, dto.data_inicio);
  }

  // Filtro opcional por período (data de fim)
  if (dto.data_fim && options.data) {
    query.lte(options.data, dto.data_fim);
  }
}

