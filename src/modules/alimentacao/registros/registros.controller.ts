import { Controller, Get, Post, Body, Param, Patch, Delete, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { RegistrosService } from './registros.service';
import { CreateRegistroAlimentacaoDto } from './dto/create-registro.dto';
import { UpdateRegistroAlimentacaoDto } from './dto/update-registro.dto';
import { SupabaseAuthGuard } from '../../auth/guards/auth.guard';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiBearerAuth('JWT-auth')
@UseGuards(SupabaseAuthGuard)
@ApiTags('Alimentação - Registros')
@Controller('alimentacao/registros')
export class RegistrosController {
  constructor(private readonly service: RegistrosService) {}

  @Post()
  @ApiOperation({ 
    summary: 'Cria um registro de alimentação',
    description: `Registra uma ocorrência de alimentação fornecida a um grupo de búfalos.
    
    **Campos obrigatórios:**
    - id_propriedade: UUID da propriedade
    - id_grupo: UUID do grupo de búfalos
    - id_aliment_def: UUID da definição de alimentação (use GET /alimentacoes-def/propriedade/:id para listar)
    - id_usuario: UUID do usuário que está registrando
    - quantidade: Valor numérico positivo
    - unidade_medida: String (kg, g, L, etc)
    
    **Campos opcionais:**
    - freq_dia: Frequência por dia (número inteiro)
    - dt_registro: Data/hora no formato ISO 8601
    
    **Retorna:** O registro completo criado com id_registro gerado.`,
  })
  @ApiResponse({ status: 201, description: 'Registro criado com sucesso.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos. Verifique os campos obrigatórios e formatos.' })
  @ApiResponse({ status: 401, description: 'Não autorizado. Token de autenticação inválido ou ausente.' })
  create(@Body() dto: CreateRegistroAlimentacaoDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista registros de alimentação' })
  @ApiResponse({ status: 200, description: 'Lista retornada.' })
  findAll() {
    return this.service.findAll();
  }

  @Get('propriedade/:id_propriedade')
  @ApiOperation({ 
    summary: 'Lista todos os registros de alimentação de uma propriedade',
    description: `Retorna todos os registros de alimentação de uma propriedade específica.
    
    **Inclui joins com:**
    - alimentacao_def: tipo_alimentacao e descricao
    - grupo: nome_grupo e nivel_maturidade
    - usuario: nome do usuário que registrou
    
    **Ordenação:** Por data de criação (mais recentes primeiro).`,
  })
  @ApiResponse({ status: 200, description: 'Lista de registros da propriedade retornada com sucesso.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  findByPropriedade(@Param('id_propriedade', ParseUUIDPipe) idPropriedade: string) {
    return this.service.findByPropriedade(idPropriedade);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um registro por ID' })
  @ApiResponse({ status: 200, description: 'Registro encontrado.' })
  @ApiResponse({ status: 404, description: 'Registro não encontrado.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ 
    summary: 'Atualiza um registro de alimentação',
    description: `Atualiza parcialmente um registro de alimentação existente.
    
    **Todos os campos são opcionais** - apenas os campos fornecidos serão atualizados.
    
    **Campos comumente atualizados:**
    - quantidade: Nova quantidade fornecida
    - freq_dia: Nova frequência por dia
    - unidade_medida: Nova unidade de medida
    
    **Retorna:** O registro completo atualizado.`,
  })
  @ApiResponse({ status: 200, description: 'Registro atualizado com sucesso.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 404, description: 'Registro não encontrado.' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateRegistroAlimentacaoDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove um registro de alimentação' })
  @ApiResponse({ status: 200, description: 'Registro removido.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
