import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiParam } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../../auth/auth.guard';
import { User } from '../../auth/user.decorator';
import { DadosSanitariosService } from './dados-sanitarios.service';
import { CreateDadosSanitariosDto } from './dto/create-dados-sanitarios.dto';
import { UpdateDadosSanitariosDto } from './dto/update-dados-sanitarios.dto';

@ApiBearerAuth('JWT-auth')
@UseGuards(SupabaseAuthGuard)
@ApiTags('Saúde/Zootecnia - Dados Sanitários') 
@Controller('dados-sanitarios')
export class DadosSanitariosController {
  constructor(private readonly service: DadosSanitariosService) {}

  @Post()
  @ApiOperation({ summary: 'Cria um novo registro sanitário' })
  @ApiResponse({ status: 201, description: 'Registro criado com sucesso.' })
  create(@Body() dto: CreateDadosSanitariosDto, @User('sub') id_usuario: string) {
    return this.service.create(dto, id_usuario);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todos os registros sanitários' })
  @ApiResponse({ status: 200, description: 'Lista retornada com sucesso.' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um registro sanitário pelo ID' })
  @ApiParam({ name: 'id', description: 'ID do registro sanitário', type: Number })
  @ApiResponse({ status: 200, description: 'Registro encontrado.' })
  @ApiResponse({ status: 404, description: 'Registro não encontrado.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza um registro sanitário' })
  @ApiParam({ name: 'id', description: 'ID do registro sanitário a ser atualizado', type: Number })
  @ApiResponse({ status: 200, description: 'Registro atualizado com sucesso.' })
  @ApiResponse({ status: 404, description: 'Registro não encontrado.' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateDadosSanitariosDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove um registro sanitário' })
  @ApiParam({ name: 'id', description: 'ID do registro sanitário a ser removido', type: Number })
  @ApiResponse({ status: 200, description: 'Registro removido com sucesso.' })
  @ApiResponse({ status: 404, description: 'Registro não encontrado.' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
