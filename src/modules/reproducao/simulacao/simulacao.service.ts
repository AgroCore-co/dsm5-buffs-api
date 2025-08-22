import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { BufaloService } from '../../rebanho/bufalo/bufalo.service';
import { SimularAcasalamentoDto } from './dto/simular-acasalamento.dto';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class SimulacaoService {
  // ATENÇÃO: Substitua pela URL da sua API de IA quando ela estiver no ar.
  private readonly iaApiUrl = 'http://127.0.0.1:5001/prever_leite';

  constructor(
    private readonly bufaloService: BufaloService,
    private readonly httpService: HttpService,
  ) {}

  async preverPotencial(dto: SimularAcasalamentoDto, user: any) {
    const { id_macho, id_femea } = dto;

    // 1. Busca os dados dos animais. O `findOne` já trata a segurança e o NotFound.
    const macho = await this.bufaloService.findOne(id_macho, user);
    const femea = await this.bufaloService.findOne(id_femea, user);

    // Futuramente, você irá enriquecer este payload com mais dados do seu banco
    const payloadParaIA = {
      caracteristicas_macho: {
        id: macho.id_bufalo,
        raca: macho.id_raca,
        // ...outros dados que seu modelo de IA precisar
      },
      caracteristicas_femea: {
        id: femea.id_bufalo,
        raca: femea.id_raca,
        // Ex: producao_leite_anterior: 3000 (buscar do banco)
      },
    };

    // 2. Tenta chamar a API de IA ou retorna um mock se falhar
    try {
      // QUANDO A IA ESTIVER PRONTA, DESCOMENTE AS LINHAS ABAIXO:
      /*
      const response = await firstValueFrom(
        this.httpService.post(this.iaApiUrl, payloadParaIA)
      );
      return response.data;
      */

      // **RESPOSTA SIMULADA (MOCK) PARA DESENVOLVIMENTO**
      // Remova este trecho quando a API de IA for conectada.
      console.log('Retornando resposta simulada. Payload que seria enviado:', JSON.stringify(payloadParaIA, null, 2));
      return {
        status: "simulado",
        previsao_potencial: {
          producao_leite_litros_estimada: parseFloat((Math.random() * (3500 - 2500) + 2500).toFixed(2)),
          observacao: "Este é um valor simulado. A predição real dependerá do modelo de IA treinado.",
        }
      };

    } catch (error) {
      console.error('Erro ao chamar a API de IA:', error.code, error.message);
      // Retorna um erro amigável se a API de IA estiver offline
      throw new InternalServerErrorException('O serviço de predição está indisponível no momento.');
    }
  }
}