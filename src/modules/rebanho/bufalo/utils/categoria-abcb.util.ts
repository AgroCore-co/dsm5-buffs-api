import { CategoriaABCB } from '../dto/categoria-abcb.dto';
import { ArvoreGenealogicaNode } from '../../../reproducao/genealogia/genealogia.service';

export class CategoriaABCBUtil {
  /**
   * Calcula categoria ABCB baseada na genealogia e propriedade ABCB
   */
  static calcularCategoria(arvoreGenealogica: ArvoreGenealogicaNode, propriedadeParticipaABCB: boolean, temRacaDefinida: boolean): CategoriaABCB {
    // Se propriedade não participa da ABCB, sempre SRD
    if (!propriedadeParticipaABCB) {
      return CategoriaABCB.SRD;
    }

    // Se não tem raça definida, é SRD
    if (!temRacaDefinida) {
      return CategoriaABCB.SRD;
    }

    // Se tem raça mas não tem genealogia (caso do "Zé Buceta"), é PA
    if (!arvoreGenealogica.pai && !arvoreGenealogica.mae) {
      return CategoriaABCB.PA;
    }

    const racaAnimal = arvoreGenealogica.id_raca;

    // Se não tem raça definida, não pode ser categorizado como puro
    if (!racaAnimal) {
      return this.temControleGenealogico(arvoreGenealogica) ? CategoriaABCB.CCG : CategoriaABCB.SRD;
    }

    // Verifica 4 gerações puras para PO
    if (this.verificarGeracoesPuras(arvoreGenealogica, racaAnimal, 4)) {
      return CategoriaABCB.PO;
    }

    // Verifica 3 gerações puras para PC
    if (this.verificarGeracoesPuras(arvoreGenealogica, racaAnimal, 3)) {
      return CategoriaABCB.PC;
    }

    // Se tem controle genealógico mas não atende critérios de pureza
    if (this.temControleGenealogico(arvoreGenealogica)) {
      return CategoriaABCB.CCG;
    }

    // Tem raça definida mas genealogia incompleta
    return CategoriaABCB.PA;
  }

  /**
   * Verifica se tem N gerações puras da mesma raça
   */
  private static verificarGeracoesPuras(arvore: ArvoreGenealogicaNode, racaAlvo: string | null, geracoesNecessarias: number): boolean {
    if (!arvore || !racaAlvo || arvore.id_raca !== racaAlvo) {
      return false;
    }

    // Se chegou no limite de gerações necessárias
    if (arvore.geracao >= geracoesNecessarias) {
      return arvore.id_raca === racaAlvo;
    }

    // Verifica se tem pai e mãe (genealogia completa)
    if (!arvore.pai || !arvore.mae) {
      return false;
    }

    // Verifica recursivamente pai e mãe
    return (
      this.verificarGeracoesPuras(arvore.pai, racaAlvo, geracoesNecessarias) && this.verificarGeracoesPuras(arvore.mae, racaAlvo, geracoesNecessarias)
    );
  }

  /**
   * Verifica se tem algum controle genealógico
   */
  private static temControleGenealogico(arvore: ArvoreGenealogicaNode): boolean {
    return Boolean(arvore.pai || arvore.mae);
  }
}
