import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { BufaloService } from '../../rebanho/bufalo/bufalo.service';
import { SimularAcasalamentoDto } from './dto/simular-acasalamento.dto';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class SimulacaoService {
  // CORREÇÃO 1: Atualizada a URL para o endpoint final da IA.
  private readonly iaApiUrl = 'http://127.0.0.1:5001/prever_potencial_cria';

  constructor(
    private readonly bufaloService: BufaloService,
    private readonly httpService: HttpService,
  ) {}

  async preverPotencial(dto: SimularAcasalamentoDto, user: any) {
    const { id_macho, id_femea } = dto;

    // 1. A busca dos animais continua perfeita.
    // O findOne garante que os IDs existem e pertencem ao usuário.
    const macho = await this.bufaloService.findOne(id_macho, user);
    const femea = await this.bufaloService.findOne(id_femea, user);

    // CORREÇÃO 2: Simplificado o payload para enviar apenas os IDs,
    // como a versão final da IA espera.
    const payloadParaIA = {
      id_macho: macho.id_bufalo,
      id_femea: femea.id_bufalo,
    };

    // 2. A chamada para a API agora está correta.
    try {
      console.log('Enviando para a IA:', JSON.stringify(payloadParaIA, null, 2));
      
      const response = await firstValueFrom(
        this.httpService.post(this.iaApiUrl, payloadParaIA)
      );
      
      console.log('Resposta da IA recebida com sucesso.');
      return response.data;

    } catch (error) {
      console.error('Erro ao chamar a API de IA:', error.response?.data || error.code || error.message);
      throw new InternalServerErrorException('O serviço de predição está indisponível no momento.');
    }
  }
}
