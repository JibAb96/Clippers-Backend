import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthRepository } from "./auth.repository";
import { AuthController } from './auth.controller';
import { CreatorsModule } from "../creators/creators.module";
import { UserFacadeService } from "./user-facade.service";
import { SupabaseModule } from "../supabase/supabase.module";

@Module({
  providers: [AuthService, UserFacadeService, AuthRepository],
  exports: [AuthService],
  controllers: [AuthController],
  imports:[CreatorsModule, SupabaseModule]
})
export class AuthModule {}
