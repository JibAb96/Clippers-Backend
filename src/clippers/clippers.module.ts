import { Module } from '@nestjs/common';
import { ClippersService } from './clippers.service';
import { ClippersController } from './clippers.controller';
import { PortfolioService } from './portforlio.service';
import { ClippersRepository } from './clippers.repository';
import { PortfolioRepository } from './portfolio.repository';
import { SupabaseModule } from '../supabase/supabase.module';
import { ClippersFacadeService } from './clippers-facade.service';

@Module({
  providers: [
    ClippersService,
    PortfolioService,
    ClippersRepository,
    PortfolioRepository,
    ClippersFacadeService,
  ],
  controllers: [ClippersController],
  exports: [ClippersService],
  imports: [SupabaseModule],
})
export class ClippersModule {}
