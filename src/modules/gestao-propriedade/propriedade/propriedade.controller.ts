import { Controller, Post, Body, UseGuards, Get, Param, ParseIntPipe, Patch, Delete, HttpCode, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { PropriedadeService } from './propriedade.service';
import { CreatePropriedadeDto } from './dto/create-propiedade.dto';
import { UpdatePropriedadeDto } from './dto/update-propriedade.dto';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../../auth/guards/auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { User } from '../../auth/decorators/user.decorator';
import { Cargo } from '../../usuario/enums/cargo.enum';

@ApiBearerAuth('JWT-auth')
@UseGuards(SupabaseAuthGuard)
@ApiTags('Gestão de Propriedade - Propriedades')
@Controller('propriedades')
export class PropriedadeController {
  constructor(private readonly propriedadeService: PropriedadeService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Cargo.PROPRIETARIO)
  @ApiOperation({
    summary: 'Criar propriedade',
    description: 'Cria uma nova propriedade. Disponível apenas para proprietários.',
  })
  @ApiResponse({ status: 201, description: 'Propriedade criada com sucesso.' })
  @ApiResponse({ status: 403, description: 'Acesso negado. Apenas proprietários podem gerenciar propriedades.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos ou endereço não encontrado.' })
  @ApiResponse({
    status: 404,
    description: 'Perfil do usuário não encontrado.',
  })
  create(@Body() createPropriedadeDto: CreatePropriedadeDto, @User() user: any) {
    return this.propriedadeService.create(createPropriedadeDto, user);
  }

  @Get()
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(3600)
  @ApiOperation({ summary: 'Lista todas as propriedades do usuário' })
  @ApiResponse({ status: 200, description: 'Lista de propriedades retornada com sucesso.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  findAll(@User() user: any) {
    return this.propriedadeService.findAll(user);
  }

  @Get(':id')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(3600)
  @ApiOperation({ summary: 'Busca uma propriedade específica pelo ID' })
  @ApiResponse({ status: 200, description: 'Dados da propriedade retornados.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 404, description: 'Propriedade não encontrada ou não pertence a este usuário.' })
  findOne(@Param('id', ParseIntPipe) id: number, @User() user: any) {
    return this.propriedadeService.findOne(id, user);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Cargo.PROPRIETARIO)
  @ApiOperation({ summary: 'Atualiza uma propriedade' })
  @ApiResponse({ status: 200, description: 'Propriedade atualizada com sucesso.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 404, description: 'Propriedade não encontrada ou não pertence a este usuário.' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updatePropriedadeDto: UpdatePropriedadeDto, @User() user: any) {
    return this.propriedadeService.update(id, updatePropriedadeDto, user);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Cargo.PROPRIETARIO)
  @HttpCode(204)
  @ApiOperation({ summary: 'Deleta uma propriedade' })
  @ApiResponse({ status: 204, description: 'Propriedade deletada com sucesso.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 404, description: 'Propriedade não encontrada ou não pertence a este usuário.' })
  remove(@Param('id', ParseIntPipe) id: number, @User() user: any) {
    return this.propriedadeService.remove(id, user);
  }
}
