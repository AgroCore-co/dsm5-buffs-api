import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseIntPipe } from '@nestjs/common';
import { DadosZootecnicosService } from './dados-zootecnicos.service';
import { CreateDadoZootecnicoDto } from './dto/create-dado-zootecnico.dto';
import { UpdateDadoZootecnicoDto } from './dto/update-dado-zootecnico.dto';
import { SupabaseAuthGuard } from '../../auth/auth.guard';
import { User } from 'src/modules/auth/user.decorator';

// Rota: /bufalos/:id_bufalo/dados-zootecnicos
@UseGuards(SupabaseAuthGuard)
@Controller('bufalos/:id_bufalo/dados-zootecnicos')
export class DadosZootecnicosController {
  constructor(private readonly service: DadosZootecnicosService) {}

  @Post()
  create(
    @Param('id_bufalo', ParseIntPipe) id_bufalo: number,
    @Body() createDto: CreateDadoZootecnicoDto,
    @User('id') id_usuario: number, // Pega o ID do usuário logado
  ) {
    return this.service.create(createDto, id_bufalo, id_usuario);
  }

  @Get()
  findAllByBufalo(@Param('id_bufalo', ParseIntPipe) id_bufalo: number) {
    return this.service.findAllByBufalo(id_bufalo);
  }

  // A rota abaixo é para pegar um registro específico, independente do búfalo
  @Get(':id_zootec')
  findOne(@Param('id_zootec', ParseIntPipe) id_zootec: number) {
    return this.service.findOne(id_zootec);
  }

  @Patch(':id_zootec')
  update(
    @Param('id_zootec', ParseIntPipe) id_zootec: number,
    @Body() updateDto: UpdateDadoZootecnicoDto,
  ) {
    return this.service.update(id_zootec, updateDto);
  }

  @Delete(':id_zootec')
  remove(@Param('id_zootec', ParseIntPipe) id_zootec: number) {
    return this.service.remove(id_zootec);
  }
}