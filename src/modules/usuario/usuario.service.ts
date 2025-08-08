import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from '../../core/supabase/supabase.service';

@Injectable()
export class UsuarioService {
  private supabase: SupabaseClient;

  constructor(private readonly supabaseService: SupabaseService) {
    this.supabase = this.supabaseService.getClient();
  }

  // O método findAll continua o mesmo
  async findAll() {
    const { data, error } = await this.supabase.from('Usuario').select('*');
    if (error) {
      throw new Error(error.message);
    }
    return data;
  }

  // MÉTODO MODIFICADO PARA DEPURAÇÃO
  async findOneById(id: string) {
    // 1. Adicionamos um log para ver o ID que está chegando
    console.log(`--- INICIANDO BUSCA NO SERVIÇO ---`);
    console.log(`Procurando no banco pelo auth_id: ${id}`);

    // 2. Removemos o .single() para ver o resultado como um array
    const { data, error } = await this.supabase
      .from('Usuario')
      .select('*')
      .eq('auth_id', id);

    // 3. Adicionamos logs para ver a resposta exata do Supabase
    console.log(`Resposta do Supabase (data):`, data);
    console.log(`Resposta do Supabase (error):`, error);
    console.log(`--- FIM DA BUSCA NO SERVIÇO ---`);

    // Lógica original para tratar a resposta
    if (error) {
      throw new Error(`Erro retornado pelo Supabase: ${error.message}`);
    }

    if (!data || data.length === 0) {
      throw new NotFoundException(
        `Nenhum perfil de usuário encontrado para o ID: ${id}`,
      );
    }

    // Se tudo deu certo, retorna o primeiro item do array
    return data[0];
  }
}