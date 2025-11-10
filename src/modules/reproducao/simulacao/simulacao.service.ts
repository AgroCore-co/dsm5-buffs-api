import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { BufaloService } from '../../rebanho/bufalo/bufalo.service';
import { SimularAcasalamentoDto } from './dto/simular-acasalamento.dto';
import { EncontrarMachosCompativeisDto } from './dto/encontrar-machos-compativeis.dto';
import { firstValueFrom } from 'rxjs';
import { AnaliseGenealogicaDto } from './dto/analise-genealogica.dto';

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

  async encontrarMachosCompativeis(dto: EncontrarMachosCompativeisDto, user: any) {
    const { id_femea, max_consanguinidade } = dto;

    const femea = await this.bufaloService.findOne(id_femea, user);

    try {
      console.log(`Buscando machos compatíveis para fêmea ID: ${id_femea} com consanguinidade máxima: ${max_consanguinidade}%`);

      const response = await firstValueFrom(
        this.httpService.get(`${this.iaApiUrl}/machos-compatíveis/${id_femea}`, {
          params: {
            max_consanguinidade: max_consanguinidade,
          },
        }),
      );

      console.log('Machos compatíveis encontrados com sucesso.');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar machos compatíveis:', error.response?.data || error.code || error.message);
      throw new InternalServerErrorException('O serviço de busca de machos compatíveis está indisponível no momento.');
    }
  }

  async analiseGenealogica(dto: AnaliseGenealogicaDto, user: any) {
    const { id_bufalo } = dto;

    const bufalo = await this.bufaloService.findOne(id_bufalo, user);

    try {
      console.log('Realizando análise genealógica para a búfala: ' + bufalo.id_bufalo);

      const response = await firstValueFrom(
        this.httpService.post(`${this.iaApiUrl}/analise-genealogica`, { id_bufalo: bufalo.id_bufalo }, { timeout: 60000 }),
      );

      console.log('Análise genealógica feita com sucesso');

      return response.data;
    } catch (error) {
      console.error('Erro ao efetuar análise genealógica:', error.response?.data || error.code || error.message);
      throw new InternalServerErrorException('O serviço de análise genealógica está indisponível no momento.');
    }
  }
}
