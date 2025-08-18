import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SupabaseStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly configService: ConfigService) {
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
    // O 'payload' é o conteúdo decodificado do token.
    // Nós simplesmente o retornamos para que o NestJS o anexe a 'request.user'.
    return payload;
  }
}
