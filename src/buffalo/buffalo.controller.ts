import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { BuffaloService } from './buffalo.service';
import { CreateBuffaloDto } from './dto/create-buffalo.dto';
import { UpdateBuffaloDto } from './dto/update-buffalo.dto';

@Controller('buffalo')
export class BuffaloController {
  constructor(private readonly buffaloService: BuffaloService) {}

  @Post()
  create(@Body() createBuffaloDto: CreateBuffaloDto) {
    return this.buffaloService.create(createBuffaloDto);
  }

  @Get()
  findAll() {
    return this.buffaloService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.buffaloService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBuffaloDto: UpdateBuffaloDto) {
    return this.buffaloService.update(+id, updateBuffaloDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.buffaloService.remove(+id);
  }
}
