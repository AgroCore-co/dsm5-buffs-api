import { 
  Controller, 
  Post, 
  Body, 
  UseGuards, 
  Get, 
  Param, 
  Query 
} from '@nestjs/common';
import { SimulacaoService } from './simulacao.service';
import { SimularAcasalamentoDto } from './dto/simular-acasalamento.dto';
import { EncontrarMachosCompativeisDto } from './dto/encontrar-machos-compativeis.dto';
import { AnaliseGenealogicaDto } from './dto/analise-genealogica.dto';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth, 
  ApiParam, 
  ApiQuery 
} from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../../auth/guards/auth.guard';
import { User } from '../../auth/decorators/user.decorator';

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

  @Get('machos-compativeis/:id_femea')
  @ApiOperation({ summary: 'Encontra machos compatíveis para uma fêmea baseado na consanguinidade' })
  @ApiParam({ 
    name: 'id_femea', 
    description: 'ID da búfala fêmea', 
    example: 15,
    type: 'number'
  })
  @ApiQuery({ 
    name: 'max_consanguinidade', 
    description: 'Consanguinidade máxima aceitável em %', 
    example: 6.25, 
    required: false,
    type: 'number'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de machos compatíveis retornada com sucesso.',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id_bufalo: { 
            type: 'number', 
            description: 'ID do búfalo macho compatível',
            example: 8
          },
          consanguinidade_macho: { 
            type: 'number', 
            description: 'Nível de consanguinidade em %',
            example: 3.25
          }
        },
        required: ['id_bufalo', 'consanguinidade_macho']
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Fêmea não encontrada ou não pertence a este usuário.' })
  @ApiResponse({ status: 400, description: 'ID fornecido não é de uma fêmea.' })
  @ApiResponse({ status: 500, description: 'Erro interno do servidor ou serviço de IA indisponível.' })
  encontrarMachosCompativeis(
    @Param('id_femea') id_femea: string,
    @Query('max_consanguinidade') max_consanguinidade: string,
    @User() user: any,
  ) {
    return this.simulacaoService.encontrarMachosCompativeis(
      {
        id_femea: id_femea,
        max_consanguinidade: max_consanguinidade ? parseFloat(max_consanguinidade) : 6.25
      },
      user
    );
  }

  @Post('analise-genealogica')
  @ApiOperation({ summary: 'Realiza uma análise genealógica completa de um búfalo e calcula o coeficiente de consanguinidade' })
  @ApiResponse({ status: 200, description: 'Análise genealógica concluída com sucesso.' })
  @ApiResponse({ status: 404, description: 'Búfalo não encontrado ou não pertence a este usuário.' })
  @ApiResponse({ status: 400, description: 'ID inválido ou não informado.' })
  @ApiResponse({ status: 500, description: 'Erro interno do servidor ou serviço de IA indisponível.' })
  async analiseGenealogica(
    @Body() analiseGenealogicaDto: AnaliseGenealogicaDto,
    @User() user: any,
  ) {
    return this.simulacaoService.analiseGenealogica(analiseGenealogicaDto, user);
  }
}
