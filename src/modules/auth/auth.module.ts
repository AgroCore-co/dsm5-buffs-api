import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { SupabaseStrategy } from './supabase.strategy';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CoreModule } from '../../core/core.module';

@Module({
  imports: [
    PassportModule,
    CoreModule, // Para ter acesso ao SupabaseService
  ],
  controllers: [AuthController],
  providers: [SupabaseStrategy, AuthService],
  exports: [SupabaseStrategy, AuthService],
})
export class AuthModule {}
