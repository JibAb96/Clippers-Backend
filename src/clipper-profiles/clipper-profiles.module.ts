import { Module } from '@nestjs/common';
import { ClipperProfilesService } from './clipper-profiles.service';
import { ClipperProfilesController } from './clipper-profiles.controller';

@Module({
  providers: [ClipperProfilesService],
  controllers: [ClipperProfilesController]
})
export class ClipperProfilesModule {}
