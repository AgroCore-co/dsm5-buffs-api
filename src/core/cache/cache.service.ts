import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  /**
   * Buscar do cache
   */
  async get<T>(key: string): Promise<T | undefined> {
    try {
      const result = await this.cacheManager.get<T>(key);
      if (result) {
        this.logger.debug(`Cache HIT: ${key}`);
      } else {
        this.logger.debug(`Cache MISS: ${key}`);
      }
      return result;
    } catch (error) {
      this.logger.warn(`Erro ao buscar cache: ${key}`, error);
      return undefined;
    }
  }

  /**
   * Salvar no cache
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      await this.cacheManager.set(key, value, ttl);
      this.logger.debug(`Cache SET: ${key} (TTL: ${ttl || 'default'})`);
    } catch (error) {
      this.logger.warn(`Erro ao definir cache: ${key}`, error);
    }
  }

  /**
   * Deletar do cache
   */
  async del(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
      this.logger.debug(`Cache DEL: ${key}`);
    } catch (error) {
      this.logger.warn(`Erro ao remover cache: ${key}`, error);
    }
  }

  /**
   * Limpar todo o cache (limitado pelo cache-manager)
   */
  async reset(): Promise<void> {
    try {
      // cache-manager não tem reset, então usamos uma solução alternativa
      this.logger.log('Cache reset solicitado - TTL vai expirar naturalmente');
    } catch (error) {
      this.logger.warn('Erro ao limpar cache', error);
    }
  }

  /**
   * Padrão cache-aside - buscar ou executar função
   */
  async getOrSet<T>(
    key: string, 
    fetchFunction: () => Promise<T>, 
    ttl: number = 300000
  ): Promise<T> {
    try {
      let data = await this.get<T>(key);
      
      if (!data) {
        data = await fetchFunction();
        await this.set(key, data, ttl);
      }
      
      return data;
    } catch (error) {
      this.logger.warn(`Erro no getOrSet para ${key}`, error);
      return await fetchFunction(); // Fallback para busca direta
    }
  }

  /**
   * Invalidar múltiplas chaves conhecidas
   */
  async invalidateKeys(keys: string[]): Promise<void> {
    for (const key of keys) {
      await this.del(key);
    }
  }

  /**
   * Gerar chave de cache baseada no usuário
   */
  generateUserKey(userId: string, resource: string, params?: any): string {
    const paramStr = params ? `:${Buffer.from(JSON.stringify(params)).toString('base64').slice(0, 10)}` : '';
    return `user:${userId}:${resource}${paramStr}`;
  }
}
