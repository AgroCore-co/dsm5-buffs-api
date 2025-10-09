import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../../core/supabase/supabase.service';

@Injectable()
export class AuthService {
  constructor(private readonly supabase: SupabaseService) {}

  async signUp(email: string, password: string, metadata?: any) {
    const { data, error } = await this.supabase.getClient().auth.signUp({
      email,
      password,
      options: {
        data: metadata || {},
      },
    });

    if (error) {
      if (error.message.includes('already registered')) {
        throw new BadRequestException('Email já está em uso');
      }
      throw new BadRequestException(`Erro ao criar usuário: ${error.message}`);
    }

    // ✅ CRIAR PERFIL AUTOMATICAMENTE na tabela usuario
    if (data.user && metadata?.nome) {
      try {
        const { error: perfilError } = await this.supabase.getAdminClient()
          .from('usuario')
          .insert({
            auth_id: data.user.id,
            email: data.user.email,
            nome: metadata.nome,
            telefone: metadata.telefone || null,
            cargo: 'PROPRIETARIO',
          });

        if (perfilError) {
          console.error('[AuthService] Erro ao criar perfil:', perfilError);
          // Não lançar erro, pois o usuário pode criar o perfil depois via POST /usuarios
        }
      } catch (err) {
        console.error('[AuthService] Exceção ao criar perfil:', err);
      }
    }

    return {
      user: {
        id: data.user?.id,
        email: data.user?.email,
        metadata: data.user?.user_metadata,
      },
      session: data.session,
      message: 'Usuário criado com sucesso. Verifique seu email para confirmar a conta.',
    };
  }

  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.getClient().auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    return {
      access_token: data.session?.access_token,
      refresh_token: data.session?.refresh_token,
      expires_at: data.session?.expires_at,
      user: {
        id: data.user?.id,
        email: data.user?.email,
        metadata: data.user?.user_metadata,
      },
    };
  }

  async refresh(refreshToken: string) {
    const { data, error } = await this.supabase.getClient().auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error) {
      throw new UnauthorizedException('Token de refresh inválido');
    }

    return {
      access_token: data.session?.access_token,
      refresh_token: data.session?.refresh_token,
      expires_at: data.session?.expires_at,
      user: {
        id: data.user?.id,
        email: data.user?.email,
        metadata: data.user?.user_metadata,
      },
    };
  }

  async signOut() {
    const { error } = await this.supabase.getClient().auth.signOut();

    if (error) {
      throw new BadRequestException('Erro ao fazer logout');
    }

    return { message: 'Logout realizado com sucesso' };
  }
}
