import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { ClipperProfilesModule } from './clipper-profiles/clipper-profiles.module';

@Module({
  imports: [UsersModule, ClipperProfilesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
