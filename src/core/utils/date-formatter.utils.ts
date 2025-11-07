/**
 * Utilitário para formatação de datas no padrão brasileiro
 *
 * ⚠️ IMPORTANTE: Use apenas para APRESENTAÇÃO (response da API)
 * ❌ NÃO use para: cálculos, queries no banco, comparações de datas
 * ✅ USE para: formatar datas antes de retornar ao cliente
 *
 * FLUXO CORRETO:
 * 1. Recebe dados do banco (ISO format) ✅
 * 2. Faz cálculos com Date nativo ✅
 * 3. Antes do return, formata com formatDateFields() ✅
 *
 * Exemplo:
 * ```typescript
 * const data = await this.supabase.from('estoque').select('*');
 * return formatDateFields(data); // ✅ apenas na saída
 * ```
 */

/**
 * Formata uma data ISO para o formato brasileiro (DD/MM/YYYY)
 * @param isoDate - Data no formato ISO (YYYY-MM-DDTHH:mm:ss.sssZ)
 * @returns Data no formato DD/MM/YYYY ou null se inválida
 */
export function formatToBrazilianDate(isoDate: string | null | undefined): string | null {
  if (!isoDate) return null;

  try {
    const date = new Date(isoDate);
    return date.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  } catch {
    return null;
  }
}

/**
 * Formata uma data ISO para o formato brasileiro com hora (DD/MM/YYYY HH:mm)
 * @param isoDate - Data no formato ISO
 * @returns Data no formato DD/MM/YYYY HH:mm ou null se inválida
 */
export function formatToBrazilianDateTime(isoDate: string | null | undefined): string | null {
  if (!isoDate) return null;

  try {
    const date = new Date(isoDate);
    return date.toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return null;
  }
}

/**
 * Formata uma data ISO para apenas a data (YYYY-MM-DD)
 * Útil para campos de data sem hora
 * @param isoDate - Data no formato ISO
 * @returns Data no formato YYYY-MM-DD ou null se inválida
 */
export function formatToSimpleDate(isoDate: string | null | undefined): string | null {
  if (!isoDate) return null;

  try {
    return new Date(isoDate).toISOString().split('T')[0];
  } catch {
    return null;
  }
}

/**
 * Formata automaticamente os campos de data de um registro
 * Campos dt_* são formatados como data simples (YYYY-MM-DD)
 * Campos *_at são formatados como data/hora brasileira (DD/MM/YYYY HH:mm)
 *
 * @param record - Registro com campos de data
 * @param dateFields - Array de campos que devem ser formatados como data simples (opcional)
 * @param dateTimeFields - Array de campos que devem ser formatados como data/hora (opcional)
 * @returns Registro com campos de data formatados
 *
 * @example
 * const estoque = { dt_registro: '2025-11-07T00:00:00Z', created_at: '2025-11-06T01:23:51.605422Z' };
 * formatDateFields(estoque);
 * // Resultado: { dt_registro: '2025-11-07', created_at: '06/11/2025 01:23' }
 */
export function formatDateFields<T extends Record<string, any>>(record: T, dateFields?: string[], dateTimeFields?: string[]): T {
  if (!record) return record;

  const formatted: any = { ...record };

  // Formatar campos especificados como data simples
  if (dateFields) {
    dateFields.forEach((field) => {
      if (field in formatted) {
        formatted[field] = formatToSimpleDate(formatted[field]);
      }
    });
  } else {
    // Auto-detectar campos dt_* para data simples
    Object.keys(formatted).forEach((key) => {
      if (key.startsWith('dt_') && typeof formatted[key] === 'string') {
        formatted[key] = formatToSimpleDate(formatted[key]);
      }
    });
  }

  // Formatar campos especificados como data/hora
  if (dateTimeFields) {
    dateTimeFields.forEach((field) => {
      if (field in formatted) {
        formatted[field] = formatToBrazilianDateTime(formatted[field]);
      }
    });
  } else {
    // Auto-detectar campos *_at para data/hora brasileira
    Object.keys(formatted).forEach((key) => {
      if (key.endsWith('_at') && typeof formatted[key] === 'string') {
        formatted[key] = formatToBrazilianDateTime(formatted[key]);
      }
    });
  }

  return formatted as T;
}

/**
 * Formata um array de registros aplicando formatDateFields em cada um
 * @param records - Array de registros
 * @param dateFields - Campos de data simples
 * @param dateTimeFields - Campos de data/hora
 * @returns Array com registros formatados
 */
export function formatDateFieldsArray<T extends Record<string, any>>(records: T[], dateFields?: string[], dateTimeFields?: string[]): T[] {
  if (!records || !Array.isArray(records)) return records;
  return records.map((record) => formatDateFields(record, dateFields, dateTimeFields));
}
