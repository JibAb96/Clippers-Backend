import { Module } from '@nestjs/common';
import { ClipsService } from './clips.service';
import { ClipsController } from './clips.controller';
import { ClipsRepository } from './clips.repository';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  providers: [ClipsService, ClipsRepository],
  controllers: [ClipsController],
  exports: [ClipsService],
})
export class ClipsModule {}
