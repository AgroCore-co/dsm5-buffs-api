import { Injectable, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../../../../core/supabase/supabase.service';

@Injectable()
export class CoberturaValidator {
  constructor(private readonly supabase: SupabaseService) {}

  /**
   * Valida se fêmea já está prenha ou possui gestação em andamento.
   */
  async validarGestacaoDuplicada(id_bufala: string, dt_evento: string): Promise<void> {
    const { data: coberturasAtivas, error } = await this.supabase
      .getAdminClient()
      .from('dadosreproducao')
      .select('id_repro, status, dt_evento')
      .eq('id_bufala', id_bufala)
      .in('status', ['Em andamento', 'Confirmada'])
      .is('deleted_at', null);

    if (error) {
      throw new BadRequestException('Erro ao verificar gestações existentes');
    }

    if (coberturasAtivas && coberturasAtivas.length > 0) {
      const gestacao = coberturasAtivas[0];
      throw new BadRequestException(
        `Fêmea já possui gestação ${gestacao.status.toLowerCase()} (Cobertura ID: ${gestacao.id_repro}, Data: ${new Date(gestacao.dt_evento).toLocaleDateString('pt-BR')})`,
      );
    }
  }

  /**
   * Valida idade mínima para reprodução.
   * Fêmeas: 18 meses | Machos: 24 meses
   */
  async validarIdadeMinimaReproducao(id_animal: string, sexo: 'M' | 'F'): Promise<void> {
    const { data: animal, error } = await this.supabase
      .getAdminClient()
      .from('bufalo')
      .select('dt_nascimento, nome')
      .eq('id_bufalo', id_animal)
      .single();

    if (error || !animal) {
      throw new BadRequestException(`Animal não encontrado: ${id_animal}`);
    }

    if (!animal.dt_nascimento) {
      throw new BadRequestException(`Animal "${animal.nome}" não possui data de nascimento registrada`);
    }

    const birthDate = new Date(animal.dt_nascimento);
    const now = new Date();
    const ageInMonths = (now.getFullYear() - birthDate.getFullYear()) * 12 + (now.getMonth() - birthDate.getMonth());

    const minAge = sexo === 'F' ? 18 : 24;
    const animalTipo = sexo === 'F' ? 'Fêmea' : 'Macho';

    if (ageInMonths < minAge) {
      const anos = Math.floor(ageInMonths / 12);
      const meses = ageInMonths % 12;
      const idadeAtual = anos > 0 ? `${anos} ano(s) e ${meses} mês(es)` : `${meses} mês(es)`;

      throw new BadRequestException(
        `${animalTipo} "${animal.nome}" não atingiu idade mínima para reprodução. Mínimo: ${minAge} meses. Idade atual: ${idadeAtual}`,
      );
    }
  }

  /**
   * Valida idade máxima para reprodução.
   * Fêmeas: 15 anos | Machos: 12 anos
   */
  async validarIdadeMaximaReproducao(id_animal: string, sexo: 'M' | 'F'): Promise<void> {
    const { data: animal, error } = await this.supabase
      .getAdminClient()
      .from('bufalo')
      .select('dt_nascimento, nome')
      .eq('id_bufalo', id_animal)
      .single();

    if (error || !animal) {
      return; // Animal não encontrado, outra validação já capturou
    }

    if (!animal.dt_nascimento) {
      return; // Sem data de nascimento, validação anterior já tratou
    }

    const birthDate = new Date(animal.dt_nascimento);
    const now = new Date();
    let ageInYears = now.getFullYear() - birthDate.getFullYear();
    const monthDiff = now.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate())) {
      ageInYears--;
    }

    const maxAge = sexo === 'F' ? 15 : 12;
    const animalTipo = sexo === 'F' ? 'Fêmea' : 'Macho';

    if (ageInYears > maxAge) {
      throw new BadRequestException(
        `${animalTipo} "${animal.nome}" ultrapassou idade recomendada para reprodução. Máximo: ${maxAge} anos. Idade atual: ${ageInYears} anos`,
      );
    }
  }

  /**
   * Valida intervalo mínimo entre partos (12 meses).
   */
  async validarIntervaloEntrePartos(id_bufala: string, dt_evento: string): Promise<void> {
    const { data: ultimoParto, error } = await this.supabase
      .getAdminClient()
      .from('dadosreproducao')
      .select('dt_parto')
      .eq('id_bufala', id_bufala)
      .not('dt_parto', 'is', null)
      .order('dt_parto', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = nenhum resultado encontrado
      throw new BadRequestException('Erro ao verificar histórico de partos');
    }

    if (ultimoParto && ultimoParto.dt_parto) {
      const dataUltimoParto = new Date(ultimoParto.dt_parto);
      const dataNovaCobertura = new Date(dt_evento);

      const diffTime = dataNovaCobertura.getTime() - dataUltimoParto.getTime();
      const diffMonths = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30.44)); // Média de dias por mês

      if (diffMonths < 12) {
        throw new BadRequestException(
          `Intervalo mínimo entre partos é de 12 meses. Último parto: ${dataUltimoParto.toLocaleDateString('pt-BR')}. Intervalo atual: ${diffMonths} mês(es)`,
        );
      }
    }
  }

  /**
   * Valida se o macho não está sendo usado excessivamente.
   * Recomendação: Mínimo 3 dias de intervalo entre coberturas naturais.
   */
  async validarIntervaloUsoMacho(id_macho: string, dt_evento: string): Promise<void> {
    const { data: ultimaCobertura, error } = await this.supabase
      .getAdminClient()
      .from('dadosreproducao')
      .select('dt_evento')
      .eq('id_bufalo', id_macho)
      .eq('tipo_inseminacao', 'Monta Natural')
      .order('dt_evento', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new BadRequestException('Erro ao verificar histórico do reprodutor');
    }

    if (ultimaCobertura && ultimaCobertura.dt_evento) {
      const dataUltimaCobertura = new Date(ultimaCobertura.dt_evento);
      const dataNovaCobertura = new Date(dt_evento);

      const diffTime = dataNovaCobertura.getTime() - dataUltimaCobertura.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 3) {
        throw new BadRequestException(
          `Intervalo mínimo entre coberturas do mesmo reprodutor é de 3 dias. Última cobertura: ${dataUltimaCobertura.toLocaleDateString('pt-BR')}. Intervalo atual: ${diffDays} dia(s)`,
        );
      }
    }
  }

  /**
   * Valida se o animal está ativo (status = true) e não foi deletado.
   */
  async validarAnimalAtivo(id_animal: string): Promise<void> {
    const { data: animal, error } = await this.supabase
      .getAdminClient()
      .from('bufalo')
      .select('status, deleted_at, nome')
      .eq('id_bufalo', id_animal)
      .single();

    if (error || !animal) {
      throw new BadRequestException(`Animal não encontrado: ${id_animal}`);
    }

    if (animal.deleted_at) {
      throw new BadRequestException(`Animal "${animal.nome}" foi removido e não pode ser usado para reprodução`);
    }

    if (!animal.status) {
      throw new BadRequestException(`Animal "${animal.nome}" está inativo (morto ou fora da propriedade)`);
    }
  }

  /**
   * Valida todas as regras de negócio para uma nova cobertura.
   */
  async validarNovaCobertura(id_bufala: string, dt_evento: string): Promise<void> {
    // Validar se animal está ativo
    await this.validarAnimalAtivo(id_bufala);

    // Validar gestação duplicada
    await this.validarGestacaoDuplicada(id_bufala, dt_evento);

    // Validar idades mínimas e máximas
    await this.validarIdadeMinimaReproducao(id_bufala, 'F');
    await this.validarIdadeMaximaReproducao(id_bufala, 'F');

    // Validar intervalo entre partos
    await this.validarIntervaloEntrePartos(id_bufala, dt_evento);
  }
}
