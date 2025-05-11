import { Module } from '@nestjs/common';
import { SupabaseService } from './supabase.service';
import { ConfigModule } from '@nestjs/config';
import { SupabaseAuthClientService } from './supabase-auth-client.service';

@Module({
  imports: [ConfigModule],
  providers: [SupabaseService, SupabaseAuthClientService],
  exports: [SupabaseService, SupabaseAuthClientService],
})
export class SupabaseModule {}
