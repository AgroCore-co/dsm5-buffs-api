import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { PrioridadeAlerta } from 'src/modules/alerta/dto/create-alerta.dto';

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly apiKey: string;
  private readonly apiUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.apiKey = this.configService.get<string>('GEMINI_API_KEY') || '';
    this.apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${this.apiKey}`;
  }

  /**
   * Analisa um texto de ocorrência clínica e retorna uma prioridade (BAIXA, MEDIA, ALTA).
   * @param ocorrenciaTexto O texto da anotação clínica.
   * @returns A prioridade do alerta.
   */
  async classificarPrioridadeOcorrencia(ocorrenciaTexto: string): Promise<PrioridadeAlerta> {
    if (!this.apiKey || this.apiKey.trim() === '') {
      this.logger.warn('Chave da API da Gemini não configurada. A usar prioridade MEDIA como padrão.');
      return PrioridadeAlerta.MEDIA;
    }

    const systemInstruction = `
      Você é um sistema de IA especialista em saúde de rebanhos bubalinos, atuando como um assistente de veterinária.
      Sua principal função é analisar anotações clínicas e classificar a urgência do problema.
      A sua resposta DEVE SER ESTRITAMENTE E APENAS UMA DAS SEGUINTES PALAVRAS: BAIXA, MEDIA, ALTA.

      Use o seu conhecimento para interpretar a gravidade, mesmo que a doença não esteja listada. Leve em consideração palavras-chave que modificam a gravidade, como 'leve', 'inicial', 'severo', 'grave', 'intenso'.

      ### Critérios de Classificação:

      **ALTA:**
      - **Condição:** Risco de vida iminente, alto potencial de contágio para o rebanho, dor severa ou sintomas sistêmicos graves.
      - **Exemplos de Sintomas:** Grande perda de sangue, fraturas expostas, incapacidade de se levantar, dificuldade respiratória severa, convulsões, febre alta e súbita.
      - **Exemplos de Doenças:** Suspeita de febre aftosa, raiva, botulismo, tétano, carbúnculo hemático, intoxicação grave.
      - **Exemplos em anotações:** "Animal caído no pasto", "Muito sangue saindo da narina", "Mastite gangrenosa", "Respiração ofegante e febre de 41°C".

      **MEDIA:**
      - **Condição:** Sinais clínicos que requerem atenção veterinária rápida, mas não são imediatamente fatais. Podem evoluir para um quadro grave se não tratados.
      - **Exemplos de Sintomas:** Inchaço (timpanismo), diarreia persistente, febre moderada, recusa de alimento por mais de um dia, manqueira evidente, secreção ocular/nasal purulenta.
      - **Exemplos de Doenças:** Mastite clínica (sem ser gangrenosa), pasteurelose, laminite (aguamento), pneumonia inicial, fotossensibilização.
      - **Exemplos em anotações:** "Úbere inchado e duro", "Não está comendo desde ontem", "Está mancando da pata dianteira", "Diarreia aquosa e forte".

      **BAIXA:**
      - **Condição:** Problemas localizados, parasitas (sem infestação severa), observações de rotina ou condições que podem ser monitoradas.
      - **Exemplos de Sintomas:** Pequenas escoriações, comportamento apático leve, perda de apetite leve, presença de parasitas.
      - **Exemplos de Doenças:** Infestação de carrapatos ou vermes (a menos que seja descrita como 'severa'), dermatite leve, berne.
      - **Exemplos em anotações:** "Alguns carrapatos na orelha", "Pequeno arranhão no flanco", "Comeu um pouco menos hoje", "Observação de rotina: animal parece um pouco quieto".

      Lembre-se, retorne APENAS a palavra da classificação.
    `;

    const payload = {
      system_instruction: {
        parts: [{ text: systemInstruction }],
      },
      contents: [{
        parts: [{ text: `Anote a seguinte anotação clínica de uma búfala: "${ocorrenciaTexto}"` }],
      }],
    };

    try {
      const response = await firstValueFrom(
        this.httpService.post(this.apiUrl, payload, {
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );
      
      const textResponse = response.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim()?.toUpperCase();

      if (!textResponse) {
        this.logger.warn('Resposta vazia ou inválida da API Gemini');
        return PrioridadeAlerta.MEDIA;
      }

      // Valida se a resposta é uma das prioridades esperadas
      if (Object.values(PrioridadeAlerta).includes(textResponse as PrioridadeAlerta)) {
        this.logger.log(`Ocorrência "${ocorrenciaTexto}" classificada como: ${textResponse}`);
        return textResponse as PrioridadeAlerta;
      }

      this.logger.warn(`Resposta inesperada da Gemini: "${textResponse}". A usar prioridade MEDIA.`);
      return PrioridadeAlerta.MEDIA;

    } catch (error) {
      this.logger.error('Erro ao comunicar com a API da Gemini:', error.response?.data || error.message);
      // Fallback: se a API falhar, retornamos uma prioridade padrão para não quebrar o fluxo.
      return PrioridadeAlerta.MEDIA;
    }
  }
}
