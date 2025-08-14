import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { LoteService } from './lote.service';
import { CreateLoteDto } from './dto/create-lote.dto';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../auth/auth.guard';

@ApiBearerAuth('JWT-auth')
@UseGuards(SupabaseAuthGuard)
@ApiTags('Mapas - Lotes/Piquetes')
@Controller('lotes')
export class LoteController {
  constructor(private readonly loteService: LoteService) {}

  @Get()
  @ApiOperation({ summary: 'Lista todos os lotes (piquetes) georreferenciados' })
  @ApiResponse({ status: 200, description: 'Lista de lotes retornada com sucesso.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  findAll() {
    return this.loteService.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Cria um novo lote (piquete) com dados geográficos' })
  @ApiResponse({ status: 201, description: 'Lote criado com sucesso.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  create(@Body() createLoteDto: CreateLoteDto) {
    return this.loteService.create(createLoteDto);
  }
}
