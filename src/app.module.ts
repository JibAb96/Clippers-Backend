import { Module, ValidationPipe } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ClippersModule } from './clippers/clippers.module';
import { ConfigModule } from '@nestjs/config';
import { SupabaseModule } from './supabase/supabase.module';
import { AuthModule } from './auth/auth.module';
import { CreatorsModule } from "./creators/creators.module";
import { APP_PIPE } from "@nestjs/core";
import { ClipsModule } from './clips/clips.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `./.env.${process.env.NODE_ENV}`,
    }),
    CreatorsModule,
    ClippersModule,
    SupabaseModule,
    AuthModule,
    ClipsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
      }),
    },
  ],
})
export class AppModule {
}
