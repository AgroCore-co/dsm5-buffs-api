import { Injectable, NotFoundException, InternalServerErrorException, BadRequestException, Logger, UnauthorizedException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from '../../../core/supabase/supabase.service';
import { CreateDadosLactacaoDto } from './dto/create-dados-lactacao.dto';
import { UpdateDadosLactacaoDto } from './dto/update-dados-lactacao.dto';
import { AlertasService } from '../../alerta/alerta.service';
import { CreateAlertaDto, NichoAlerta, PrioridadeAlerta } from '../../alerta/dto/create-alerta.dto';
import { GeminiService } from '../../../core/gemini/gemini.service';

@Injectable()
export class ControleLeiteiroService {
  private readonly logger = new Logger(ControleLeiteiroService.name);
  private supabase: SupabaseClient;

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly alertasService: AlertasService,
    private readonly geminiService: GeminiService,
  ) {
    this.supabase = this.supabaseService.getClient();
  }

  /**
   * Método privado para obter o ID numérico do usuário a partir do token.
   */
  private async getUserId(user: any): Promise<number> {
    const { data: perfilUsuario, error } = await this.supabase.from('Usuario').select('id_usuario').eq('email', user.email).single();

    if (error || !perfilUsuario) {
      throw new NotFoundException('Perfil de usuário não encontrado.');
    }
    return perfilUsuario.id_usuario;
  }

  /**
   * Cria um registro de lactação, associando-o ao usuário autenticado.
   * Se houver uma ocorrência clínica, cria um alerta associado.
   */
  async create(createDto: CreateDadosLactacaoDto, user: any) {
    const idUsuario = await this.getUserId(user);

    const dtoToInsert = { ...createDto, id_usuario: idUsuario };

    const { data: lactacaoData, error } = await this.supabase.from('DadosLactacao').insert(dtoToInsert).select().single();

    if (error) {
      if (error.code === '23503') {
        throw new BadRequestException(`A búfala com id ${createDto.id_bufala} não foi encontrada.`);
      }
      console.error('Erro ao criar dado de lactação:', error);
      throw new InternalServerErrorException('Falha ao criar o dado de lactação.');
    }

    if (!lactacaoData) {
      throw new InternalServerErrorException('Falha ao obter dados do registro de lactação criado.');
    }

    // Lógica para criação de Alerta
    if (createDto.ocorrencia && createDto.ocorrencia.trim() !== '') {
      this.processarAlertaOcorrencia(createDto, lactacaoData).catch((alertaError) => {
        console.error('Erro ao processar alerta para ocorrência clínica:', alertaError);
      });
    }

    return lactacaoData;
  }

  /**
   * Método privado para processar a criação de alerta quando há ocorrência clínica.
   */
  private async processarAlertaOcorrencia(createDto: CreateDadosLactacaoDto, lactacaoData: any): Promise<void> {
    try {
      const { data: bufaloInfo, error: bufaloError } = await this.supabase
        .from('Bufalo')
        .select(
          `
          grupo:Grupo ( nome_grupo ),
          propriedade:Propriedade ( nome )
        `,
        )
        .eq('id_bufalo', createDto.id_bufala)
        .single();

      if (bufaloError) {
        console.error('Erro ao buscar dados do búfalo para o alerta:', bufaloError.message);
        throw new Error(`Falha ao buscar informações do búfalo: ${bufaloError.message}`);
      }

      if (!bufaloInfo) {
        throw new Error('Informações do búfalo não encontradas.');
      }

      // Classificar prioridade usando Gemini
      const prioridadeClassificada = await this.geminiService.classificarPrioridadeOcorrencia(createDto.ocorrencia!);

      const alertaDto: CreateAlertaDto = {
        animal_id: createDto.id_bufala,
        grupo: (bufaloInfo.grupo as any)?.nome_grupo || 'Não informado',
        localizacao: (bufaloInfo.propriedade as any)?.nome || 'Não informada',
        motivo: createDto.ocorrencia!,
        nicho: NichoAlerta.CLINICO,
        data_alerta: createDto.dt_ordenha,
        prioridade: prioridadeClassificada,
        observacao: `Ocorrência registrada durante a ordenha do dia ${createDto.dt_ordenha}. Prioridade classificada automaticamente pela IA.`,
      };

      await this.alertasService.create(alertaDto);
    } catch (error) {
      console.error('Erro ao processar criação de alerta:', error);
      throw error;
    }
  }

  /**
   * Lista todos os registros de lactação (sem limitação de usuário).
   */
  async findAll(page = 1, limit = 20) {
    this.logger.log(`[INICIO] Buscando dados de lactação - página ${page}, limite ${limit}`);

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    try {
      const { data, error, count } = await this.supabase
        .from('DadosLactacao')
        .select(
          `
          *,
          bufalo:id_bufala(
            id_bufalo,
            nome,
            brinco,
            grupo:id_grupo(nome_grupo),
            raca:id_raca(nome)
          )
        `,
          { count: 'exact' },
        )
        .order('dt_ordenha', { ascending: false })
        .range(from, to);

      if (error) {
        this.logger.error(`[ERRO] Falha na consulta: ${error.message}`);
        throw new InternalServerErrorException(`Erro ao buscar dados de lactação: ${error.message}`);
      }

      this.logger.log(`[SUCESSO] ${data.length} registros de lactação encontrados (página ${page})`);

      return {
        message: 'Dados de lactação recuperados com sucesso',
        total: count ?? data.length,
        page,
        limit,
        dados: data,
      };
    } catch (error) {
      this.logger.error(`[ERRO_GERAL] ${error.message}`);
      throw error;
    }
  }
  // MÉTODO CORRIGIDO ABAIXO
  /**
   * Lista todos os registros de lactação de uma búfala específica.
   * A autorização é baseada na propriedade do animal, não no criador do registro.
   */
  async findAllByBufala(id_bufala: number, page = 1, limit = 20, user: any) {
    this.logger.log(`[INICIO] Buscando dados de lactação para a búfala ${id_bufala} - página ${page}, limite ${limit}`);
    const idUsuario = await this.getUserId(user);

    // Etapa 1: Verificar se a búfala existe e se o usuário tem permissão para vê-la.
    // Buscamos a búfala e a propriedade associada para verificar o dono (id_dono).
    const { data: bufalaData, error: bufalaError } = await this.supabase
      .from('Bufalo')
      .select('id_bufalo, propriedade:Propriedade(id_dono)')
      .eq('id_bufalo', id_bufala)
      .single();

    if (bufalaError || !bufalaData) {
      throw new NotFoundException(`Búfala com ID ${id_bufala} não encontrada.`);
    }

    // Acessando o id_dono através da relação aninhada.
    const idDonoPropriedade = (bufalaData.propriedade as any)?.id_dono;

    // Se a propriedade não tiver dono ou o dono for diferente do usuário logado, negamos o acesso.
    // (Esta regra pode ser expandida para incluir funcionários da propriedade no futuro).
    if (!idDonoPropriedade || idDonoPropriedade !== idUsuario) {
      throw new UnauthorizedException(`Você não tem permissão para acessar os dados desta búfala.`);
    }

    // Etapa 2: Buscar os registros de lactação paginados, agora sem filtrar pelo id_usuario.
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    try {
      const { data, error, count } = await this.supabase
        .from('DadosLactacao')
        .select(
          `
          *,
          bufalo:id_bufala(
            id_bufalo,
            nome,
            brinco
          ),
          usuario:id_usuario(
            id_usuario,
            nome
          )
        `,
          { count: 'exact' },
        )
        .eq('id_bufala', id_bufala) // <-- A única condição de filtro necessária aqui
        .order('dt_ordenha', { ascending: false })
        .range(from, to);

      if (error) {
        this.logger.error(`[ERRO] Falha na consulta para búfala ${id_bufala}: ${error.message}`);
        throw new InternalServerErrorException(`Erro ao buscar dados de lactação: ${error.message}`);
      }

      this.logger.log(`[SUCESSO] ${data.length} registros encontrados para a búfala ${id_bufala} (página ${page})`);

      return {
        message: `Dados de lactação da búfala ${id_bufala} recuperados com sucesso`,
        total: count ?? data.length,
        page,
        limit,
        dados: data,
      };
    } catch (error) {
      this.logger.error(`[ERRO_GERAL] Búfala ${id_bufala}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Busca um registro de lactação específico, garantindo que ele pertença ao usuário logado.
   */
  async findOne(id: number, user: any) {
    const idUsuario = await this.getUserId(user);

    const { data, error } = await this.supabase.from('DadosLactacao').select('*').eq('id_lact', id).eq('id_usuario', idUsuario).single();

    if (error || !data) {
      throw new NotFoundException(`Registro de lactação com ID ${id} não encontrado ou não pertence a este usuário.`);
    }
    return data;
  }

  /**
   * Atualiza um registro de lactação, verificando a posse antes da operação.
   */
  async update(id: number, updateDto: UpdateDadosLactacaoDto, user: any) {
    await this.findOne(id, user);

    const { data, error } = await this.supabase.from('DadosLactacao').update(updateDto).eq('id_lact', id).select().single();

    if (error) {
      throw new InternalServerErrorException('Falha ao atualizar o dado de lactação.');
    }
    return data;
  }

  /**
   * Remove um registro de lactação, verificando a posse antes de deletar.
   */
  async remove(id: number, user: any) {
    await this.findOne(id, user);

    const { error } = await this.supabase.from('DadosLactacao').delete().eq('id_lact', id);

    if (error) {
      throw new InternalServerErrorException('Falha ao remover o dado de lactação.');
    }
    return;
  }
}
