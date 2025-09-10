import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseIntPipe, HttpCode } from '@nestjs/common';
import { BufaloService } from './bufalo.service';
import { CreateBufaloDto } from './dto/create-bufalo.dto';
import { UpdateBufaloDto } from './dto/update-bufalo.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../../auth/auth.guard';
import { User } from '../../auth/user.decorator';
import { CategoriaABCB } from './dto/categoria-abcb.dto';

@ApiBearerAuth('JWT-auth')
@UseGuards(SupabaseAuthGuard)
@ApiTags('Rebanho - Búfalos')
@Controller('bufalos')
export class BufaloController {
  constructor(private readonly bufaloService: BufaloService) {}

  @Post()
  @ApiOperation({ summary: 'Registra um novo búfalo para o usuário logado' })
  @ApiResponse({ status: 201, description: 'Búfalo registrado com sucesso.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  @ApiResponse({ status: 404, description: 'Propriedade, raça ou outra referência não encontrada.' })
  create(@Body() createBufaloDto: CreateBufaloDto, @User() user: any) {
    return this.bufaloService.create(createBufaloDto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todos os búfalos do usuário logado' })
  @ApiResponse({ status: 200, description: 'Lista de búfalos retornada com sucesso.' })
  findAll(@User() user: any) {
    return this.bufaloService.findAll(user);
  }

  @Get('categoria/:categoria')
  @ApiOperation({ summary: 'Lista búfalos por categoria ABCB' })
  @ApiParam({ name: 'categoria', description: 'Categoria ABCB', enum: CategoriaABCB })
  @ApiResponse({ status: 200, description: 'Búfalos da categoria retornados com sucesso.' })
  findByCategoria(@Param('categoria') categoria: CategoriaABCB, @User() user: any) {
    return this.bufaloService.findByCategoria(categoria, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um búfalo específico pelo ID' })
  @ApiParam({ name: 'id', description: 'ID do búfalo', type: Number })
  @ApiResponse({ status: 200, description: 'Dados do búfalo.' })
  @ApiResponse({ status: 404, description: 'Búfalo não encontrado ou não pertence a este usuário.' })
  findOne(@Param('id', ParseIntPipe) id: number, @User() user: any) {
    return this.bufaloService.findOne(id, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza os dados de um búfalo' })
  @ApiParam({ name: 'id', description: 'ID do búfalo a ser atualizado', type: Number })
  @ApiResponse({ status: 200, description: 'Búfalo atualizado com sucesso.' })
  @ApiResponse({ status: 404, description: 'Búfalo não encontrado ou não pertence a este usuário.' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateBufaloDto: UpdateBufaloDto, @User() user: any) {
    return this.bufaloService.update(id, updateBufaloDto, user);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Remove um búfalo do rebanho' })
  @ApiParam({ name: 'id', description: 'ID do búfalo a ser removido', type: Number })
  @ApiResponse({ status: 204, description: 'Búfalo removido com sucesso.' })
  @ApiResponse({ status: 404, description: 'Búfalo não encontrado ou não pertence a este usuário.' })
  remove(@Param('id', ParseIntPipe) id: number, @User() user: any) {
    return this.bufaloService.remove(id, user);
  }

  @Post('processar-categoria/:id')
  @ApiOperation({ summary: 'Força o processamento da categoria ABCB de um búfalo' })
  @ApiParam({ name: 'id', description: 'ID do búfalo' })
  @ApiResponse({ status: 200, description: 'Categoria processada com sucesso.' })
  async processarCategoria(@Param('id', ParseIntPipe) id: number) {
    await this.bufaloService.processarCategoriaABCB(id);
    return { message: 'Categoria processada com sucesso' };
  }
}