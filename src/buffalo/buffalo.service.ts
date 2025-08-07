import { Injectable } from '@nestjs/common';
import { CreateBuffaloDto } from './dto/create-buffalo.dto';
import { UpdateBuffaloDto } from './dto/update-buffalo.dto';

@Injectable()
export class BuffaloService {
  create(createBuffaloDto: CreateBuffaloDto) {
    return 'This action adds a new buffalo';
  }

  findAll() {
    return `This action returns all buffalo`;
  }

  findOne(id: number) {
    return `This action returns a #${id} buffalo`;
  }

  update(id: number, updateBuffaloDto: UpdateBuffaloDto) {
    return `This action updates a #${id} buffalo`;
  }

  remove(id: number) {
    return `This action removes a #${id} buffalo`;
  }
}
