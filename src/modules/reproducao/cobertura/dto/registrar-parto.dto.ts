import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsString, IsIn, IsOptional, IsBoolean, IsInt, IsPositive } from 'class-validator';

const tiposParto = ['Normal', 'Cesárea', 'Aborto'];

/**
 * DTO para registro de parto e criação automática de ciclo de lactação.
 *
 * Fluxo de negócio:
 * 1. Atualiza registro de cobertura (status -> 'Concluída', dt_parto)
 * 2. Se tipo_parto for Normal/Cesárea E criar_ciclo_lactacao=true:
 *    - Cria novo registro em ciclolactacao
 *    - Define dt_secagem_prevista = dt_parto + padrao_dias_lactacao
 *    - Inicia ciclo com status "Em Lactação"
 * 3. Se tipo_parto for Aborto: apenas atualiza cobertura (sem ciclo)
 *
 * Pré-requisito: cobertura.status deve estar como 'Confirmada'
 *
 * @example
 * {
 *   "dt_parto": "2025-10-15",
 *   "tipo_parto": "Normal",
 *   "observacao": "Parto sem complicações, bezerro saudável",
 *   "criar_ciclo_lactacao": true,
 *   "padrao_dias_lactacao": 305
 * }
 */
export class RegistrarPartoDto {
  /**
   * Data em que ocorreu o parto.
   * Deve ser posterior à data de cobertura e anterior/igual à data atual.
   * Formato: YYYY-MM-DD
   */
  @ApiProperty({
    description: 'Data do parto (formato YYYY-MM-DD)',
    format: 'date',
    example: '2025-10-15',
  })
  @IsDateString()
  dt_parto: string;

  /**
   * Tipo/método do parto.
   *
   * - "Normal": Parto vaginal sem intervenção cirúrgica
   * - "Cesárea": Parto cirúrgico (pode impactar próximo ciclo reprodutivo)
   * - "Aborto": Interrupção gestacional (não cria ciclo de lactação)
   */
  @ApiProperty({
    description: 'Tipo/método do parto realizado',
    enum: tiposParto,
    example: 'Normal',
  })
  @IsString()
  @IsIn(tiposParto)
  tipo_parto: string;

  /**
   * Observações sobre o parto.
   * Campo livre para registrar:
   * - Complicações
   * - Peso do bezerro
   * - Necessidade de assistência
   * - Estado da mãe e bezerro
   *
   * Opcional.
   */
  @ApiProperty({
    description: 'Observações detalhadas sobre o parto (opcional)',
    example: 'Parto sem complicações, bezerro macho de aproximadamente 35kg',
    required: false,
  })
  @IsString()
  @IsOptional()
  observacao?: string;

  /**
   * Flag para criação automática do ciclo de lactação.
   *
   * - true (padrão): Cria ciclo se tipo_parto for Normal/Cesárea
   * - false: Apenas registra parto sem iniciar lactação (usado para casos especiais)
   *
   * Nota: Aborto nunca cria ciclo, independente desta flag.
   */
  @ApiProperty({
    description: 'Criar ciclo de lactação automaticamente (default: true)',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  criar_ciclo_lactacao?: boolean;

  /**
   * Duração padrão do ciclo de lactação em dias.
   *
   * Valor padrão: 305 dias (padrão da indústria bubalina)
   *
   * Usado para calcular dt_secagem_prevista = dt_parto + padrao_dias_lactacao.
   * Pode ser ajustado conforme estratégia de manejo da propriedade.
   */
  @ApiProperty({
    description: 'Duração padrão do ciclo de lactação em dias (default: 305)',
    example: 305,
    default: 305,
    minimum: 1,
  })
  @IsInt()
  @IsPositive()
  @IsOptional()
  padrao_dias_lactacao?: number;
}
