import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsOptional, MinLength } from 'class-validator';
import { AuthService } from './auth.service';

export class SignUpDto {
  @ApiProperty({ 
    description: 'Email do usuário',
    example: 'usuario@example.com'
  })
  @IsEmail()
  email: string;

  @ApiProperty({ 
    description: 'Senha do usuário (mínimo 6 caracteres)',
    example: 'minhasenha123'
  })
  @IsString()
  @MinLength(6, { message: 'Senha deve ter pelo menos 6 caracteres' })
  password: string;

  @ApiProperty({ 
    description: 'Nome completo do usuário',
    example: 'João Silva',
    required: false
  })
  @IsOptional()
  @IsString()
  nome?: string;

  @ApiProperty({ 
    description: 'Telefone do usuário',
    example: '11999999999',
    required: false
  })
  @IsOptional()
  @IsString()
  telefone?: string;
}

export class SignInDto {
  @ApiProperty({ 
    description: 'Email do usuário',
    example: 'usuario@example.com'
  })
  @IsEmail()
  email: string;

  @ApiProperty({ 
    description: 'Senha do usuário',
    example: 'minhasenha123'
  })
  @IsString()
  password: string;
}

export class RefreshDto {
  @ApiProperty({ 
    description: 'Token de refresh',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  })
  @IsString()
  refresh_token: string;
}

@ApiTags('Autenticação')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @ApiOperation({ 
    summary: 'Registra um novo usuário no Supabase Auth',
    description: 'Cria uma conta de autenticação para um usuário. Após o signup bem-sucedido, o usuário deve confirmar o email e depois fazer login para obter um token JWT válido.'
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
    description: 'Autentica o usuário e retorna tokens de acesso. O access_token deve ser usado no header Authorization: Bearer <token> para acessar endpoints protegidos.'
  })
  @ApiResponse({ status: 200, description: 'Login realizado com sucesso.' })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas ou email não confirmado.' })
  async signIn(@Body() signInDto: SignInDto) {
    return this.authService.signIn(signInDto.email, signInDto.password);
  }

  @Post('refresh')
  @ApiOperation({ 
    summary: 'Renova o token de acesso',
    description: 'Usa o refresh_token para obter um novo access_token quando o atual expira.'
  })
  @ApiResponse({ status: 200, description: 'Token renovado com sucesso.' })
  @ApiResponse({ status: 401, description: 'Refresh token inválido ou expirado.' })
  async refresh(@Body() refreshDto: RefreshDto) {
    return this.authService.refresh(refreshDto.refresh_token);
  }

  @Post('signout')
  @ApiOperation({ 
    summary: 'Faz logout do usuário',
    description: 'Invalida a sessão atual do usuário.'
  })
  @ApiResponse({ status: 200, description: 'Logout realizado com sucesso.' })
  async signOut() {
    return this.authService.signOut();
  }
}
