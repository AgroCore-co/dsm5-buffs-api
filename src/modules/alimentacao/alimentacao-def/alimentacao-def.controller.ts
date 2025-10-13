import { Controller, Get, Post, Body, UseGuards, Param, Patch, Delete, ParseUUIDPipe, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { AlimentacaoDefService } from './alimentacao-def.service';
import { CreateAlimentacaoDefDto } from './dto/create-alimentacao-def.dto';
import { UpdateAlimentacaoDefDto } from './dto/update-alimentacao-def.dto';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../../auth/guards/auth.guard';

@ApiBearerAuth('JWT-auth')
@UseGuards(SupabaseAuthGuard)
@ApiTags('Alimentação - Definições')
@Controller('alimentacoes-def')
export class AlimentacaoDefController {
  constructor(private readonly alimentacaoDefService: AlimentacaoDefService) {}

  @Get()
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(3600)
  @ApiOperation({
    summary: 'Lista todas as alimentações definidas',
    description: 'Retorna uma lista de todas as alimentações definidas cadastradas no sistema, ordenadas alfabeticamente.',
  })
  @ApiResponse({ status: 200, description: 'Lista de alimentações definidas retornada com sucesso.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  findAll() {
    return this.alimentacaoDefService.findAll();
  }

  @Get(':id')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(3600) // 1 hour - feeding definitions are relatively static
  @ApiOperation({
    summary: 'Busca uma alimentação definida específica',
    description: 'Retorna os dados de uma alimentação definida específica pelo ID.',
  })
  @ApiParam({ name: 'id', description: 'ID da alimentação definida', type: 'string' })
  @ApiResponse({ status: 200, description: 'Alimentação definida encontrada com sucesso.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 404, description: 'Alimentação definida não encontrada.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.alimentacaoDefService.findOne(id);
  }

  @Get('propriedade/:id_propriedade')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(1800) // 30 minutes
  @ApiOperation({
    summary: 'Lista todas as definições de alimentação de uma propriedade',
    description: 'Retorna uma lista de todas as definições de alimentação cadastradas para uma propriedade específica.',
  })
  @ApiParam({ name: 'id_propriedade', description: 'ID da propriedade', type: 'string' })
  @ApiResponse({ status: 200, description: 'Lista de definições de alimentação da propriedade retornada com sucesso.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  findByPropriedade(@Param('id_propriedade', ParseUUIDPipe) idPropriedade: string) {
    return this.alimentacaoDefService.findByPropriedade(idPropriedade);
  }

  @Post()
  @ApiOperation({
    summary: 'Cria uma nova alimentação definida',
    description: 'Cria um novo registro de alimentação definida no banco de dados. Retorna a alimentação completa com o ID gerado.',
  })
  @ApiResponse({ status: 201, description: 'Alimentação definida criada com sucesso.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  create(@Body() createAlimentacaoDefDto: CreateAlimentacaoDefDto) {
    return this.alimentacaoDefService.create(createAlimentacaoDefDto);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Atualiza uma alimentação definida',
    description: 'Atualiza os dados de uma alimentação definida específica pelo ID.',
  })
  @ApiParam({ name: 'id', description: 'ID da alimentação definida', type: 'string' })
  @ApiResponse({ status: 200, description: 'Alimentação definida atualizada com sucesso.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 404, description: 'Alimentação definida não encontrada.' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateAlimentacaoDefDto: UpdateAlimentacaoDefDto) {
    return this.alimentacaoDefService.update(id, updateAlimentacaoDefDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Remove uma alimentação definida',
    description: 'Remove uma alimentação definida específica do sistema pelo ID.',
  })
  @ApiParam({ name: 'id', description: 'ID da alimentação definida', type: 'string' })
  @ApiResponse({ status: 200, description: 'Alimentação definida removida com sucesso.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 404, description: 'Alimentação definida não encontrada.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.alimentacaoDefService.remove(id);
  }
}
