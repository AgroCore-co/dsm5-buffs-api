import { Injectable, NotFoundException } from '@nestjs/common';
import { BufaloService } from '../../rebanho/bufalo/bufalo.service';
import { GenealogiaNodeDto } from './dto/genealogia-response.dto';

@Injectable()
export class GenealogiaService {
  constructor(private readonly bufaloService: BufaloService) {}

  public async buildTree(id: number, maxDepth: number, user: any): Promise<GenealogiaNodeDto | null> {
    try {
      const animal = await this.bufaloService.findOne(id, user);
      return this.getAnimalGenealogy(animal, 0, maxDepth, user);
    } catch (error) {
      if (error instanceof NotFoundException) {
        return null; 
      }
      throw error;
    }
  }

  private async getAnimalGenealogy(
    animal: any,
    currentDepth: number,
    maxDepth: number,
    user: any,
  ): Promise<GenealogiaNodeDto | null> {
    
    if (!animal || currentDepth >= maxDepth) {
      return null;
    }

    const findAncestor = async (ancestorId: number) => {
      if (!ancestorId) return null;
      try {
        const ancestor = await this.bufaloService.findOne(ancestorId, user);
        return this.getAnimalGenealogy(ancestor, currentDepth + 1, maxDepth, user);
      } catch (error) {
        if (error instanceof NotFoundException) {
          return null;
        }
        throw error;
      }
    };
    
    const [pai, mae] = await Promise.all([
      findAncestor(animal.id_pai),
      findAncestor(animal.id_mae),
    ]);

    const node: GenealogiaNodeDto = {
      id: animal.id_bufalo,
      nome: animal.nome,
    };
    
    if (pai) node.pai = pai;
    if (mae) node.mae = mae;

    return node;
  }
}