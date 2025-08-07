import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { LotService } from './lot.service';
import { CreateLotDto } from './dto/create-lot.dto';
import { UpdateLotDto } from './dto/update-lot.dto';
import { Lot } from './entities/lot.entity';

@ApiTags('lots')
@Controller('lots')
export class LotController {
  constructor(private readonly lotService: LotService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar um novo lote' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Lote criado com sucesso',
    type: Lot,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados inválidos ou nome do lote já em uso',
  })
  async create(@Body() createLotDto: CreateLotDto): Promise<Lot> {
    return await this.lotService.create(createLotDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os lotes' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de lotes retornada com sucesso',
    type: [Lot],
  })
  async findAll(): Promise<{ lots: Lot[] }> {
    const lots = await this.lotService.findAll();
    return { lots };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar lote por ID' })
  @ApiParam({
    name: 'id',
    description: 'ID do lote (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lote encontrado',
    type: Lot,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Lote não encontrado',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'ID inválido',
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<{ lot: Lot }> {
    const lot = await this.lotService.findOne(id);
    return { lot };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar lote' })
  @ApiParam({
    name: 'id',
    description: 'ID do lote (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lote atualizado com sucesso',
    type: Lot,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Lote não encontrado',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados inválidos ou nome do lote já em uso',
  })
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() updateLotDto: UpdateLotDto): Promise<{ lot: Lot }> {
    const lot = await this.lotService.update(id, updateLotDto);
    return { lot };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deletar lote' })
  @ApiParam({
    name: 'id',
    description: 'ID do lote (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Lote deletado com sucesso',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Lote não encontrado',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.lotService.remove(id);
  }
}