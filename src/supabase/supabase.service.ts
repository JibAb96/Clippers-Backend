import {
  ForbiddenException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  OnModuleInit,
  PayloadTooLargeException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService implements OnModuleInit {
  private supabaseClient: SupabaseClient;

  constructor(private configService: ConfigService) {}
  private readonly logger = new Logger(SupabaseService.name);

  onModuleInit() {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_KEY'); // Use the correct key (anon or service_role)
    if (!supabaseUrl) {
      this.logger.error('SUPABASE_URL not found in environment variables.');
      throw new Error('SUPABASE_URL is required.'); // Early exit if missing
    }
    if (!supabaseKey) {
      this.logger.error('SUPABASE_KEY not found in environment variables.');
      throw new Error('SUPABASE_KEY is required.'); // Early exit if missing
    }

    this.logger.log('Initializing Supabase client...');
    this.supabaseClient = createClient(supabaseUrl || '', supabaseKey || '', {
      auth: {
        persistSession: false,
      },
    });
    this.logger.log('Supabase client initialized.');
  }
  get client(): SupabaseClient {
    return this.supabaseClient;
  }

  async uploadFile(
    file: Express.Multer.File,
    bucket: string,
    path: string,
  ): Promise<string> {
      const { error } = await this.supabaseClient.storage
        .from(bucket)
        .upload(path, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        });

      if (error) {
        this.logger.error(
          `Error uploading file: ${error.message}`,
          error.stack,
        );
        if (error.message.includes('bucket not found')) {
          throw new NotFoundException(`Resource not found`);
        }
        throw error;
      }

      const {
        data: { publicUrl },
      } = this.supabaseClient.storage.from(bucket).getPublicUrl(path);
      return publicUrl;
    
  }

  async deleteFile(bucket: string, path: string): Promise<void> {
    try {
      const { data, error } = await this.supabaseClient.storage
        .from(bucket)
        .remove([path]);

      if (error) {
        if (error.message.includes('not found')) {
          throw new NotFoundException(`File at ${path} not found`);
        } else if (error.message.includes('permission denied')) {
          throw new ForbiddenException(
            `No permission to delete file at ${path}`,
          );
        } else {
          this.logger.error(
            `Error deleting file: ${error.message}`,
            error.stack,
          );
          throw new InternalServerErrorException(
            'There was an internal server error deleting file',
          );
        }
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(
        `Unexpected error deleting file: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'There was an internal server error deleting file',
      );
    }
  }
}
