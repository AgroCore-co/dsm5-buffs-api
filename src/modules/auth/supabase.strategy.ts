import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../../core/supabase/supabase.service';

@Injectable()
export class SupabaseStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly supabaseService: SupabaseService
  ) {
    const supabaseJwtSecret = configService.get<string>('SUPABASE_JWT_SECRET');

    if (!supabaseJwtSecret) {
      throw new Error('A variável de ambiente SUPABASE_JWT_SECRET não foi definida.');
    }

    super({
      // Define como o token será extraído da requisição
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // Garante que tokens expirados sejam rejeitados
      ignoreExpiration: false,
      // A chave secreta para verificar a assinatura do token
      secretOrKey: supabaseJwtSecret,
    });
  }

  async validate(payload: any) {
    // Se a estratégia chegou até aqui, o token JWT é válido.
    // Busca o cargo do usuário no banco de dados
    const supabase = this.supabaseService.getClient();
    
    const { data: usuario } = await supabase
      .from('Usuario')
      .select('cargo, id_usuario')
      .eq('email', payload.email)
      .single();

    // Retorna payload do JWT + cargo do banco
    return {
      id: payload.sub,           // auth_id do Supabase
      email: payload.email,      // email do JWT
      cargo: usuario?.cargo,     // cargo do banco de dados
      id_usuario: usuario?.id_usuario, // ID do banco
      ...payload                 // outros campos do JWT
    };
  }
}
