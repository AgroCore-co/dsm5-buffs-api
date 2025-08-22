import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { SimulacaoService } from './simulacao.service';
import { SimularAcasalamentoDto } from './dto/simular-acasalamento.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../../auth/auth.guard';
import { User } from '../../auth/user.decorator';

@ApiBearerAuth('JWT-auth')
@UseGuards(SupabaseAuthGuard)
@ApiTags('IA - Simulação')
@Controller('reproducao/simulacao')
export class SimulacaoController {
  constructor(private readonly simulacaoService: SimulacaoService) {}

  @Post()
  @ApiOperation({ summary: 'Simula um acasalamento e prevê o potencial genético da prole' })
  @ApiResponse({ status: 200, description: 'Predição retornada com sucesso (atualmente com dados simulados).' })
  @ApiResponse({ status: 404, description: 'Macho ou fêmea não encontrado ou não pertence a este usuário.' })
  preverPotencial(
    @Body() simularAcasalamentoDto: SimularAcasalamentoDto,
    @User() user: any,
  ) {
    return this.simulacaoService.preverPotencial(simularAcasalamentoDto, user);
  }
}