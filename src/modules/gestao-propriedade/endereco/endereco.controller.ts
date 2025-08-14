import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { EnderecoService } from './endereco.service';
import { CreateEnderecoDto } from './dto/create-endereco.dto';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../../auth/auth.guard';

@ApiBearerAuth('JWT-auth')
@UseGuards(SupabaseAuthGuard)
@ApiTags('Gestão - Endereços')
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
}
