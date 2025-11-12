import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../../core/supabase/supabase.service';
import { LoggerService } from '../../core/logger/logger.service';

@Injectable()
export class SupabaseStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly supabaseService: SupabaseService,
    private readonly logger: LoggerService,
  ) {
    const supabaseJwtSecret = configService.get<string>('SUPABASE_JWT_SECRET');

    if (!supabaseJwtSecret) {
      throw new Error('A variável de ambiente SUPABASE_JWT_SECRET não foi definida.');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: supabaseJwtSecret,
    });
  }

  async validate(payload: any) {
    if (!payload.sub) {
      this.logger.logError(new Error('Token sem sub'), {
        module: 'Auth',
        method: 'validate',
        payload,
      });
      throw new UnauthorizedException('Token inválido');
    }

    try {
      // ✅ Buscar perfil do usuário (se existir)
      const { data: usuario, error } = await this.supabaseService
        .getAdminClient()
        .from('usuario')
        .select('cargo, id_usuario, email, nome')
        .eq('auth_id', payload.sub)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = not found (é esperado para usuários sem perfil)
        this.logger.logError(error, {
          module: 'Auth',
          method: 'validate',
          auth_id: payload.sub,
        });
      }

      // ✅ PERMITE acesso mesmo sem perfil (para criar perfil depois)
      return {
        id: payload.sub,
        email: payload.email,
        cargo: usuario?.cargo || null, // null se ainda não criou perfil
        id_usuario: usuario?.id_usuario || null,
        nome: usuario?.nome || null,
        ...payload,
      };
    } catch (err) {
      this.logger.logError(err, {
        module: 'Auth',
        method: 'validate',
        context: 'exception',
        auth_id: payload.sub,
      });
      throw new UnauthorizedException('Erro ao validar usuário');
    }
  }
}
