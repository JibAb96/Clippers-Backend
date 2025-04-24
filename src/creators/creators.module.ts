import { Module } from '@nestjs/common';
import { CreatorsService } from './creators.service';
import { SupabaseModule } from '../supabase/supabase.module';
import { CreatorsRepository } from "./creators.repository";

@Module({
  providers: [CreatorsService, CreatorsRepository],
  imports: [SupabaseModule],
  exports: [CreatorsService]
})
export class CreatorsModule {}
