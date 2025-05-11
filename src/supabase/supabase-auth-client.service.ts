import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseAuthClientService implements OnModuleInit {
  private supabaseAuthClient: SupabaseClient;
  private readonly logger = new Logger(SupabaseAuthClientService.name);

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
  
    const supabaseKey = this.configService.get<string>('SUPABASE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      this.logger.error('Supabase URL or Key not found for Auth Client.');
      throw new Error('Supabase URL and Key are required for Auth Client.');
    }

    this.logger.log('Initializing Supabase Auth client...');
    this.supabaseAuthClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
    
        persistSession: false,
      },
    });
    this.logger.log('Supabase Auth client initialized.');
  }

  get client(): SupabaseClient {
    return this.supabaseAuthClient;
  }
}
