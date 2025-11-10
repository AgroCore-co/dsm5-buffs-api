export class BufaloAgeUtils {
  /**
   * Calcula a idade em meses de forma precisa
   */
  static calculateAgeInMonths(birthDate: Date): number {
    const now = new Date();
    const birth = new Date(birthDate);

    const yearDiff = now.getFullYear() - birth.getFullYear();
    const monthDiff = now.getMonth() - birth.getMonth();

    return yearDiff * 12 + monthDiff;
  }

  /**
   * Calcula a idade em anos de forma precisa
   */
  static calculateAgeInYears(birthDate: Date): number {
    const now = new Date();
    const birth = new Date(birthDate);

    let age = now.getFullYear() - birth.getFullYear();
    const monthDiff = now.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
      age--;
    }

    return age;
  }

  /**
   * Verifica se o búfalo está em uma faixa etária específica
   */
  static isInAgeRange(birthDate: Date, minMonths: number, maxMonths: number): boolean {
    const ageInMonths = this.calculateAgeInMonths(birthDate);
    return ageInMonths >= minMonths && ageInMonths <= maxMonths;
  }

  /**
   * Retorna a faixa etária em texto
   */
  static getAgeRange(birthDate: Date): string {
    const ageInMonths = this.calculateAgeInMonths(birthDate);
    const ageInYears = this.calculateAgeInYears(birthDate);

    if (ageInMonths < 12) {
      return `${ageInMonths} meses (${ageInYears} ano(s))`;
    } else if (ageInMonths < 24) {
      return `${ageInMonths} meses (${ageInYears} ano(s))`;
    } else {
      return `${ageInYears} ano(s)`;
    }
  }

  /**
   * Calcula quantos dias faltam para o próximo aniversário
   */
  static daysUntilNextBirthday(birthDate: Date): number {
    const now = new Date();
    const birth = new Date(birthDate);

    const nextBirthday = new Date(now.getFullYear(), birth.getMonth(), birth.getDate());

    if (nextBirthday < now) {
      nextBirthday.setFullYear(nextBirthday.getFullYear() + 1);
    }

    const diffTime = nextBirthday.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}
