import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseUUIDPipe, HttpCode, UseInterceptors, Logger } from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { BufaloService } from './bufalo.service';
import { CreateBufaloDto } from './dto/create-bufalo.dto';
import { UpdateBufaloDto } from './dto/update-bufalo.dto';
import { UpdateGrupoBufaloDto } from './dto/update-grupo-bufalo.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../../auth/guards/auth.guard';
import { User } from '../../auth/decorators/user.decorator';
import { CategoriaABCB } from './dto/categoria-abcb.dto';
import { NotFoundException, InternalServerErrorException } from '@nestjs/common';

@ApiBearerAuth('JWT-auth')
@UseGuards(SupabaseAuthGuard)
@ApiTags('Rebanho - Búfalos')
@Controller('bufalos')
export class BufaloController {
  private readonly logger = new Logger(BufaloController.name);

  constructor(private readonly bufaloService: BufaloService) {}

  @Post()
  @ApiOperation({ summary: 'Registra um novo búfalo para o usuário logado' })
  @ApiResponse({ status: 201, description: 'Búfalo registrado com sucesso.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  @ApiResponse({ status: 404, description: 'Propriedade, raça ou outra referência não encontrada.' })
  create(@Body() createBufaloDto: CreateBufaloDto, @User() user: any) {
    console.log('🎯 Controller POST /bufalos chamado');
    console.log('📝 DTO recebido:', createBufaloDto);
    console.log('👤 User:', user?.email || user?.sub);

    return this.bufaloService.create(createBufaloDto, user);
  }

  @Get()
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(300000) // 5 minutos
  @ApiOperation({ summary: 'Lista todos os búfalos do usuário logado' })
  @ApiResponse({ status: 200, description: 'Lista de búfalos retornada com sucesso.' })
  findAll(@User() user: any) {
    return this.bufaloService.findAll(user);
  }

  @Get('categoria/:categoria')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(600000) // 10 minutos - categorias mudam menos
  @ApiOperation({ summary: 'Lista búfalos por categoria ABCB' })
  @ApiParam({ name: 'categoria', description: 'Categoria ABCB', enum: CategoriaABCB })
  @ApiResponse({ status: 200, description: 'Búfalos da categoria retornados com sucesso.' })
  findByCategoria(@Param('categoria') categoria: CategoriaABCB, @User() user: any) {
    return this.bufaloService.findByCategoria(categoria, user);
  }

  @Get('microchip/:microchip')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(300000) // 5 minutos
  @ApiOperation({ summary: 'Busca um búfalo pelo microchip' })
  @ApiParam({ name: 'microchip', description: 'Número do microchip do búfalo', type: String })
  @ApiResponse({ status: 200, description: 'Búfalo encontrado com sucesso.' })
  @ApiResponse({ status: 404, description: 'Búfalo com o microchip especificado não encontrado.' })
  findByMicrochip(@Param('microchip') microchip: string) {
    return this.bufaloService.findByMicrochip(microchip);
  }

  @Get(':id')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(300000) // 5 minutos
  @ApiOperation({ summary: 'Busca um búfalo específico pelo ID' })
  @ApiParam({ name: 'id', description: 'ID do búfalo', type: String })
  @ApiResponse({ status: 200, description: 'Dados do búfalo.' })
  @ApiResponse({ status: 404, description: 'Búfalo não encontrado ou não pertence a este usuário.' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @User() user: any) {
    return this.bufaloService.findOne(id, user);
  }

  @Patch('grupo/mover')
  @ApiOperation({
    summary: 'Muda o grupo de manejo de um ou mais búfalos',
    description: `
      Move búfalos de um grupo para outro, útil para mudanças de status como:
      - Lactando → Secagem
      - Novilhas → Reprodução
      - Tratamento → Rebanho geral
      
      Esta operação não move fisicamente os animais de lote/piquete.
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Grupo dos búfalos atualizado com sucesso.',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        grupo_destino: { type: 'string' },
        total_processados: { type: 'number' },
        motivo: { type: 'string', nullable: true },
        animais: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id_bufalo: { type: 'number' },
              nome: { type: 'string' },
              grupo_anterior: { type: 'string' },
              grupo_novo: { type: 'string' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos ou búfalos duplicados.' })
  @ApiResponse({ status: 404, description: 'Um dos búfalos ou o grupo de destino não foi encontrado.' })
  async updateGrupo(@Body() updateGrupoDto: UpdateGrupoBufaloDto, @User() user: any) {
    const startTime = Date.now();
    const userInfo = user?.sub || user?.id || 'unknown';

    this.logger.log(`[REQUEST] Mudanca de grupo solicitada - Usuario: ${userInfo}, Payload: ${JSON.stringify(updateGrupoDto)}`);

    try {
      const result = await this.bufaloService.updateGrupo(updateGrupoDto, user);
      const duration = Date.now() - startTime;

      this.logger.log(
        `[RESPONSE_SUCCESS] Mudanca de grupo concluida - Usuario: ${userInfo}, Processados: ${result.total_processados}, Duracao: ${duration}ms`,
      );

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`[RESPONSE_ERROR] Falha na mudanca de grupo - Usuario: ${userInfo}, Erro: ${error.message}, Duracao: ${duration}ms`);
      throw error;
    }
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza os dados de um búfalo' })
  @ApiParam({ name: 'id', description: 'ID do búfalo a ser atualizado', type: String })
  @ApiResponse({ status: 200, description: 'Búfalo atualizado com sucesso.' })
  @ApiResponse({ status: 404, description: 'Búfalo não encontrado ou não pertence a este usuário.' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateBufaloDto: UpdateBufaloDto, @User() user: any) {
    console.log('🔄 Controller PATCH /bufalos/:id chamado');
    console.log('📝 DTO recebido:', updateBufaloDto);
    console.log('👤 User:', user?.email || user?.sub);

    return this.bufaloService.update(id, updateBufaloDto, user);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Remove um búfalo do rebanho' })
  @ApiParam({ name: 'id', description: 'ID do búfalo a ser removido', type: String })
  @ApiResponse({ status: 204, description: 'Búfalo removido com sucesso.' })
  @ApiResponse({ status: 404, description: 'Búfalo não encontrado ou não pertence a este usuário.' })
  remove(@Param('id', ParseUUIDPipe) id: string, @User() user: any) {
    console.log('🗑️ Controller DELETE /bufalos/:id chamado');
    console.log('👤 User:', user?.email || user?.sub);

    return this.bufaloService.remove(id, user);
  }

  @Post('processar-categoria/:id')
  @ApiOperation({ summary: 'Força o processamento da categoria ABCB de um búfalo' })
  @ApiParam({ name: 'id', description: 'ID do búfalo' })
  @ApiResponse({ status: 200, description: 'Categoria processada com sucesso.' })
  @ApiResponse({ status: 404, description: 'Búfalo não encontrado.' })
  @ApiResponse({ status: 500, description: 'Erro interno no processamento.' })
  async processarCategoria(@Param('id', ParseUUIDPipe) id: string, @User() user: any) {
    try {
      console.log(`Iniciando processamento da categoria para búfalo ID: ${id}`);

      // Primeiro verifica se o usuário tem acesso ao búfalo
      const bufaloAntes = await this.bufaloService.findOne(id, user);
      console.log(`Categoria antes do processamento: ${bufaloAntes.categoria}`);

      // Processa a categoria
      const resultado = await this.bufaloService.processarCategoriaABCB(id);

      // Busca o búfalo atualizado para retornar a categoria
      const bufaloAtualizado = await this.bufaloService.findOne(id, user);
      console.log(`Categoria após processamento: ${bufaloAtualizado.categoria}`);

      return {
        message: 'Categoria processada com sucesso',
        bufalo: {
          id: bufaloAtualizado.id_bufalo,
          nome: bufaloAtualizado.nome,
          categoriaAntes: bufaloAntes.categoria,
          categoriaDepois: bufaloAtualizado.categoria,
        },
        processamento: {
          sucesso: resultado !== null,
          categoriaCalculada: resultado,
        },
      };
    } catch (error) {
      console.error(`Erro no processamento da categoria para búfalo ${id}:`, error);

      // Re-throw erros conhecidos
      if (error instanceof NotFoundException || error instanceof InternalServerErrorException) {
        throw error;
      }

      // Para erros não tratados
      throw new InternalServerErrorException(`Erro inesperado no processamento da categoria: ${error.message}`);
    }
  }
}
