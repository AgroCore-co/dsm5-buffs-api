import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { BufaloService } from '../../rebanho/bufalo/bufalo.service';
import { SimularAcasalamentoDto } from './dto/simular-acasalamento.dto';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class SimulacaoService {
  private readonly iaApiUrl = process.env.IA_API_URL;

  constructor(
    private readonly bufaloService: BufaloService,
    private readonly httpService: HttpService,
  ) {}

  async preverPotencial(dto: SimularAcasalamentoDto, user: any) {
    const { id_macho, id_femea } = dto;

    // 1. A validação dos animais continua perfeita.
    const macho = await this.bufaloService.findOne(id_macho, user);
    const femea = await this.bufaloService.findOne(id_femea, user);

    const payloadParaIA = {
      id_macho: macho.id_bufalo,
      id_femea: femea.id_bufalo,
    };

    // 2. A chamada para a API agora está correta e completa.
    try {
      console.log('Enviando para a IA:', JSON.stringify(payloadParaIA, null, 2));

      const response = await firstValueFrom(
        this.httpService.post(`${this.iaApiUrl}/simular-acasalamento`, payloadParaIA, { params: { incluir_predicao_femea: true } }),
      );

      console.log('Resposta da IA recebida com sucesso.');
      return response.data;
    } catch (error) {
      console.error('Erro ao chamar a API de IA:', error.response?.data || error.code || error.message);
      throw new InternalServerErrorException('O serviço de predição está indisponível no momento.');
    }
  }
}
