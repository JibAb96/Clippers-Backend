import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';
import { AuthController } from './auth.controller';
import { CreatorsModule } from '../creators/creators.module';
import { UserFacadeService } from './user-facade.service';
import { SupabaseModule } from '../supabase/supabase.module';
import { ClippersModule } from 'src/clippers/clippers.module';
import { GoogleOAuthService } from './google-oauth.service';
import { GoogleOnboardingService } from './google-onboarding.service';

@Module({
  providers: [
    AuthService,
    UserFacadeService,
    AuthRepository,
    GoogleOAuthService,
    GoogleOnboardingService,
  ],
  exports: [AuthService, UserFacadeService, GoogleOAuthService],
  controllers: [AuthController],
  imports: [CreatorsModule, SupabaseModule, ClippersModule],
})
export class AuthModule {}
