import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SignUpDto, SignInDto, RefreshDto } from './dto';

@ApiTags('Autenticação')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @ApiOperation({
    summary: 'Registra um novo usuário no Supabase Auth',
    description:
      'Cria uma conta de autenticação para um usuário. Após o signup bem-sucedido, o usuário deve confirmar o email e depois fazer login para obter um token JWT válido.',
  })
  @ApiResponse({ status: 201, description: 'Usuário criado com sucesso. Verificação de email enviada.' })
  @ApiResponse({ status: 400, description: 'Email já está em uso ou dados inválidos.' })
  async signUp(@Body() signUpDto: SignUpDto) {
    const { email, password, nome, telefone } = signUpDto;
    const metadata = { nome, telefone };
    return this.authService.signUp(email, password, metadata);
  }

  @Post('signin')
  @ApiOperation({
    summary: 'Faz login do usuário',
    description:
      'Autentica o usuário e retorna tokens de acesso. O access_token deve ser usado no header Authorization: Bearer <token> para acessar endpoints protegidos.',
  })
  @ApiResponse({ status: 200, description: 'Login realizado com sucesso.' })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas ou email não confirmado.' })
  async signIn(@Body() signInDto: SignInDto) {
    return this.authService.signIn(signInDto.email, signInDto.password);
  }

  @Post('refresh')
  @ApiOperation({
    summary: 'Renova o token de acesso',
    description: 'Usa o refresh_token para obter um novo access_token quando o atual expira.',
  })
  @ApiResponse({ status: 200, description: 'Token renovado com sucesso.' })
  @ApiResponse({ status: 401, description: 'Refresh token inválido ou expirado.' })
  async refresh(@Body() refreshDto: RefreshDto) {
    return this.authService.refresh(refreshDto.refresh_token);
  }

  @Post('signout')
  @ApiOperation({
    summary: 'Faz logout do usuário',
    description: 'Invalida a sessão atual do usuário.',
  })
  @ApiResponse({ status: 200, description: 'Logout realizado com sucesso.' })
  async signOut() {
    return this.authService.signOut();
  }
}
