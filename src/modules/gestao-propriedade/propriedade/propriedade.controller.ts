import { Controller, Post, Body, UseGuards, Get, Param, ParseIntPipe, Patch, Delete, HttpCode } from '@nestjs/common';
import { PropriedadeService } from './propriedade.service';
import { CreatePropriedadeDto } from './dto/create-propiedade.dto';
import { UpdatePropriedadeDto } from './dto/update-propriedade.dto';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../../auth/auth.guard';
import { User } from '../../auth/user.decorator';

@ApiBearerAuth('JWT-auth')
@UseGuards(SupabaseAuthGuard)
@ApiTags('Gestão de Propriedade / Propriedades')
@Controller('propriedades')
export class PropriedadeController {
  constructor(private readonly propriedadeService: PropriedadeService) {}

  @Post()
  @ApiOperation({
    summary: 'Cadastra uma nova propriedade para o usuário logado',
    description: `Cria uma nova propriedade associada ao usuário autenticado. 
    O fluxo esperado é: 
    1. O frontend cria um endereço via 'POST /enderecos'.
    2. O frontend usa o 'id_endereco' retornado para chamar este endpoint.`,
  })
  @ApiResponse({ status: 201, description: 'Propriedade criada com sucesso.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos ou endereço não encontrado.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({
    status: 404,
    description: 'Perfil do usuário não encontrado.',
  })
  create(@Body() createPropriedadeDto: CreatePropriedadeDto, @User() user: any) {
    return this.propriedadeService.create(createPropriedadeDto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todas as propriedades do usuário logado' })
  @ApiResponse({ status: 200, description: 'Lista de propriedades retornada com sucesso.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  findAll(@User() user: any) {
    return this.propriedadeService.findAll(user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca uma propriedade específica pelo ID' })
  @ApiResponse({ status: 200, description: 'Dados da propriedade retornados.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 404, description: 'Propriedade não encontrada ou não pertence a este usuário.' })
  findOne(@Param('id', ParseIntPipe) id: number, @User() user: any) {
    return this.propriedadeService.findOne(id, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza uma propriedade' })
  @ApiResponse({ status: 200, description: 'Propriedade atualizada com sucesso.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 404, description: 'Propriedade não encontrada ou não pertence a este usuário.' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updatePropriedadeDto: UpdatePropriedadeDto, @User() user: any) {
    return this.propriedadeService.update(id, updatePropriedadeDto, user);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Deleta uma propriedade' })
  @ApiResponse({ status: 204, description: 'Propriedade deletada com sucesso.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 404, description: 'Propriedade não encontrada ou não pertence a este usuário.' })
  remove(@Param('id', ParseIntPipe) id: number, @User() user: any) {
    return this.propriedadeService.remove(id, user);
  }
}
