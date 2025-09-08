import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { PrioridadeAlerta } from '../../modules/alerta/dto/create-alerta.dto';

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private apiKey: string;
  private apiUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.apiKey = this.configService.get<any>('GEMINI_API_KEY');
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY não está definida no ficheiro .env');
    }
    this.apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${this.apiKey}`;
  }

  /**
   * Analisa uma anotação clínica e retorna uma prioridade (BAIXA, MEDIA, ALTA).
   * @param textoOcorrencia O texto a ser analisado.
   * @returns A prioridade do alerta.
   */
  async classificarPrioridadeOcorrencia(textoOcorrencia: string): Promise<PrioridadeAlerta> {
    this.logger.log('Chamando a API da Gemini para classificar a ocorrência...');
    this.logger.debug(`Texto da ocorrência: ${textoOcorrencia}`);

    const systemInstruction = `
      Aja como um assistente de veterinária especialista em búfalos leiteiros.
      A sua única tarefa é analisar uma anotação clínica e retornar APENAS UMA PALAVRA: BAIXA, MEDIA ou ALTA, correspondendo à urgência.

      REGRAS DE CLASSIFICAÇÃO:
      - ALTA: Use para risco de vida iminente, problemas contagiosos graves, ou condições que requerem intervenção imediata.
        - Exemplos: "sangue no leite", "febre aftosa", "animal caído", "não consegue levantar-se", "dificuldade severa de respirar", "fratura exposta", "brucelose".
      - MEDIA: Use para condições que requerem atenção rápida, mas não são de emergência imediata.
        - Exemplos: "mastite", "inchaço no úbere", "recusa de alimento", "comportamento apático", "perda de peso", "infestação de carrapatos", "casco inflamado".
      - BAIXA: Use para observações menores ou problemas que podem ser monitorizados.
        - Exemplos: "pequeno arranhão", "tosse ocasional", "moscas a incomodar", "ligeiramente mancando".

      Leve em consideração palavras-chave que modificam a gravidade, como 'leve', 'inicial', 'severo'.
      A sua resposta deve ser EXCLUSIVAMENTE uma das três palavras, em maiúsculas.
    `;

    const payload = {
      contents: [
        {
          parts: [{ text: `Instrução: ${systemInstruction}\n\nAnote a seguinte ocorrência: "${textoOcorrencia}"` }],
        },
      ],
    };

    try {
      const { data } = await firstValueFrom(
        this.httpService.post(this.apiUrl, payload),
      );

      const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim().toUpperCase();
      
      // Log da resposta bruta para depuração
      this.logger.debug(`Resposta bruta da IA: ${JSON.stringify(data)}`);
      this.logger.debug(`Texto extraído da IA: ${responseText}`);

      if (responseText && ['BAIXA', 'MEDIA', 'ALTA'].includes(responseText)) {
        this.logger.log(`Prioridade classificada pela IA: ${responseText}`);
        return responseText as PrioridadeAlerta;
      }

      this.logger.warn(`Resposta da IA inválida ou vazia. Resposta recebida: "${responseText}". Usando prioridade ALTA como padrão.`);
      return PrioridadeAlerta.ALTA;

    } catch (error) {
      // Log de erro MUITO mais detalhado
      this.logger.error('Erro CRÍTICO ao chamar a API da Gemini. Verifique a chave e as configurações do projeto Google Cloud.');
      if (error.response) {
        this.logger.error('Detalhes do Erro da API:', JSON.stringify(error.response.data, null, 2));
      } else {
        this.logger.error('Erro de Rede ou Configuração:', error.message);
      }
      
      this.logger.warn('Usando prioridade ALTA como padrão devido a erro na API.');
      return PrioridadeAlerta.ALTA;
    }
  }
}

