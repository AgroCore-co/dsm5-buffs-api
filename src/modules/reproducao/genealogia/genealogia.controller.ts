import { Controller, Get, Param, Query, ParseIntPipe, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { GenealogiaService } from './genealogia.service';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../../auth/guards/auth.guard';
import { User } from '../../auth/decorators/user.decorator';
import { GenealogiaNodeDto } from './dto';

@ApiBearerAuth('JWT-auth')
@UseGuards(SupabaseAuthGuard)
@ApiTags('IA - Genealogia')
@Controller('reproducao/genealogia')
export class GenealogiaController {
  constructor(private readonly genealogiaService: GenealogiaService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Obter a árvore genealógica de um búfalo' })
  @ApiParam({ name: 'id', description: 'ID do búfalo', type: 'string' })
  @ApiQuery({ name: 'geracoes', description: 'Número de gerações a serem exibidas', required: false, type: 'number', example: 3 })
  @ApiResponse({ status: 200, description: 'Árvore genealógica retornada com sucesso.', type: GenealogiaNodeDto })
  @ApiResponse({ status: 404, description: 'Búfalo não encontrado.' })
  async findGenealogia(
    @Param('id', ParseUUIDPipe) id: string,
    @User() user: any,
    @Query('geracoes', new ParseIntPipe({ optional: true })) geracoes?: number,
  ): Promise<GenealogiaNodeDto | null> {
    const profundidade = geracoes || 3;
    return this.genealogiaService.buildTree(id, profundidade, user);
  }
}
