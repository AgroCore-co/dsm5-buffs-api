import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseIntPipe } from '@nestjs/common';
import { BufaloService } from './bufalo.service';
import { CreateBufaloDto } from './dto/create-bufalo.dto';
import { UpdateBufaloDto } from './dto/update-bufalo.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../auth/auth.guard';

@ApiBearerAuth('JWT-auth')
@UseGuards(SupabaseAuthGuard)
@ApiTags('Rebanho - Búfalos')
@Controller('bufalos')
export class BufaloController {
  constructor(private readonly bufaloService: BufaloService) {}

  @Post()
  @ApiOperation({ summary: 'Registrar um novo búfalo no rebanho' })
  @ApiResponse({ status: 201, description: 'Búfalo registrado com sucesso.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  create(@Body() createBufaloDto: CreateBufaloDto) {
    return this.bufaloService.create(createBufaloDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os búfalos do rebanho' })
  @ApiResponse({ status: 200, description: 'Lista de búfalos retornada com sucesso.' })
  findAll() {
    return this.bufaloService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar um búfalo específico pelo ID' })
  @ApiParam({ name: 'id', description: 'ID do búfalo', type: Number })
  @ApiResponse({ status: 200, description: 'Dados do búfalo.' })
  @ApiResponse({ status: 404, description: 'Búfalo não encontrado.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.bufaloService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar os dados de um búfalo' })
  @ApiParam({ name: 'id', description: 'ID do búfalo a ser atualizado', type: Number })
  @ApiResponse({ status: 200, description: 'Búfalo atualizado com sucesso.' })
  @ApiResponse({ status: 404, description: 'Búfalo não encontrado.' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateBufaloDto: UpdateBufaloDto) {
    return this.bufaloService.update(id, updateBufaloDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover um búfalo do rebanho' })
  @ApiParam({ name: 'id', description: 'ID do búfalo a ser removido', type: Number })
  @ApiResponse({ status: 204, description: 'Búfalo removido com sucesso.' })
  @ApiResponse({ status: 404, description: 'Búfalo não encontrado.' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.bufaloService.remove(id);
  }
}
