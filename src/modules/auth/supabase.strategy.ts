import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../../core/supabase/supabase.service';

@Injectable()
export class SupabaseStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly supabaseService: SupabaseService,
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
      throw new UnauthorizedException('Token inválido');
    }

    // ✅ Buscar perfil do usuário (se existir)
    const { data: usuario } = await this.supabaseService
      .getAdminClient()
      .from('usuario')
      .select('cargo, id_usuario, email, nome')
      .eq('auth_id', payload.sub)
      .single();

    // ✅ PERMITE acesso mesmo sem perfil (para criar perfil depois)
    return {
      id: payload.sub,
      email: payload.email,
      cargo: usuario?.cargo || null, // null se ainda não criou perfil
      id_usuario: usuario?.id_usuario || null,
      ...payload,
    };
  }
}
