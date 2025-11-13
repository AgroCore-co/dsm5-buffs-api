export interface ISoftDelete {
  /**
   * Remove logicamente um registro (soft delete)
   * Define deleted_at para a data/hora atual
   */
  softDelete(id: string, user?: any): Promise<any>;

  /**
   * Restaura um registro removido logicamente
   * Define deleted_at como null
   */
  restore(id: string, user?: any): Promise<any>;

  /**
   * Lista todos os registros incluindo os removidos logicamente
   */
  findAllWithDeleted?(user?: any): Promise<any>;
}
