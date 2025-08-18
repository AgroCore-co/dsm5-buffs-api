import { Controller, Post, Body, UseGuards, Get, Param, Patch, Delete, ParseIntPipe } from '@nestjs/common';
import { EnderecoService } from './endereco.service';
import { CreateEnderecoDto } from './dto/create-endereco.dto';
import { UpdateEnderecoDto } from './dto/update-endereco.dto';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../../auth/auth.guard';

@ApiBearerAuth('JWT-auth')
@UseGuards(SupabaseAuthGuard)
@ApiTags('Gestão de Propriedade - Endereços')
@Controller('enderecos')
export class EnderecoController {
  constructor(private readonly enderecoService: EnderecoService) {}

  @Post()
  @ApiOperation({
    summary: 'Cadastra um novo endereço',
    description: 'Cria um novo registro de endereço no banco de dados. Retorna o endereço completo com o ID gerado.',
  })
  @ApiResponse({ status: 201, description: 'Endereço criado com sucesso.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  create(@Body() createEnderecoDto: CreateEnderecoDto) {
    return this.enderecoService.create(createEnderecoDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Lista todos os endereços',
    description: 'Retorna uma lista de todos os endereços cadastrados no sistema.',
  })
  @ApiResponse({ status: 200, description: 'Lista de endereços retornada com sucesso.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  findAll() {
    return this.enderecoService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Busca um endereço específico',
    description: 'Retorna os dados de um endereço específico pelo ID.',
  })
  @ApiParam({ name: 'id', description: 'ID do endereço', type: 'number' })
  @ApiResponse({ status: 200, description: 'Endereço encontrado com sucesso.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 404, description: 'Endereço não encontrado.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.enderecoService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Atualiza um endereço',
    description: 'Atualiza os dados de um endereço específico pelo ID.',
  })
  @ApiParam({ name: 'id', description: 'ID do endereço', type: 'number' })
  @ApiResponse({ status: 200, description: 'Endereço atualizado com sucesso.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 404, description: 'Endereço não encontrado.' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateEnderecoDto: UpdateEnderecoDto) {
    return this.enderecoService.update(id, updateEnderecoDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Remove um endereço',
    description: 'Remove um endereço específico do sistema pelo ID.',
  })
  @ApiParam({ name: 'id', description: 'ID do endereço', type: 'number' })
  @ApiResponse({ status: 200, description: 'Endereço removido com sucesso.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 404, description: 'Endereço não encontrado.' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.enderecoService.remove(id);
  }
}
