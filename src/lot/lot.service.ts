import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lot } from './entities/lot.entity';
import { CreateLotDto } from './dto/create-lot.dto';
import { UpdateLotDto } from './dto/update-lot.dto';

@Injectable()
export class LotService {
  constructor(
    @InjectRepository(Lot)
    private readonly lotRepository: Repository<Lot>,
  ) {}

  async create(createLotDto: CreateLotDto): Promise<Lot> {
    try {
      // Verificar se já existe um lote com o mesmo nome
      const existingLot = await this.lotRepository.findOne({
        where: { nomeLote: createLotDto.nomeLote },
      });

      if (existingLot) {
        throw new BadRequestException('Já existe um lote com este nome');
      }

      const lot = this.lotRepository.create(createLotDto);
      return await this.lotRepository.save(lot);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Erro ao criar lote: ' + error.message);
    }
  }

  async findAll(): Promise<Lot[]> {
    try {
      return await this.lotRepository.find({
        relations: ['responsavel', 'buffalos'],
        order: { createdAt: 'DESC' },
      });
    } catch (error) {
      throw new BadRequestException('Erro ao buscar lotes: ' + error.message);
    }
  }

  async findOne(id: string): Promise<Lot> {
    try {
      const lot = await this.lotRepository.findOne({
        where: { id },
        relations: ['responsavel', 'buffalos'],
      });

      if (!lot) {
        throw new NotFoundException(`Lote com ID ${id} não encontrado`);
      }

      return lot;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Erro ao buscar lote: ' + error.message);
    }
  }

  async update(id: string, updateLotDto: UpdateLotDto): Promise<Lot> {
    try {
      const lot = await this.findOne(id);

      // Verificar se o nome está sendo alterado e se já existe
      if (updateLotDto.nomeLote && updateLotDto.nomeLote !== lot.nomeLote) {
        const existingLot = await this.lotRepository.findOne({
          where: { nomeLote: updateLotDto.nomeLote },
        });

        if (existingLot) {
          throw new BadRequestException('Já existe um lote com este nome');
        }
      }

      await this.lotRepository.update(id, updateLotDto);
      return await this.findOne(id);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Erro ao atualizar lote: ' + error.message);
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const lot = await this.findOne(id);
      await this.lotRepository.remove(lot);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Erro ao deletar lote: ' + error.message);
    }
  }

  // Métodos auxiliares
  async findByStatus(status: string): Promise<Lot[]> {
    return await this.lotRepository.find({ 
      where: { status },
      relations: ['responsavel'] 
    });
  }

  async findByResponsavel(responsavelId: string): Promise<Lot[]> {
    return await this.lotRepository.find({ 
      where: { responsavel_id: responsavelId },
      relations: ['responsavel'] 
    });
  }
}