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
    this.supabaseClient = createClient(
      this.configService.get('SUPABASE_URL') || '',
      this.configService.get<string>('SUPABASE_KEY') || '',
      {
        auth: {
          persistSession: false,
        },
      },
    );
  }
  get client(): SupabaseClient {
    return this.supabaseClient;
  }

  async uploadFile(
    file: Express.Multer.File,
    bucket: string,
    path: string,
  ): Promise<string> {
    try {
      const { error } = await this.supabaseClient.storage
        .from(bucket)
        .upload(path, file.buffer, {
          contentType: file.mimetype,
          upsert: true,
        });

      if (error) {
        console.log('Attempting to upload to bucket:', bucket);
        console.log('Attempting to upload to path:', path);
        console.log('Attempting to upload with file.mimetype:', file.mimetype);
        console.log('Attempting to upload with file.mimetype:', file.buffer);
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
    } catch (error) {
      this.logger.error(
        `Unexpected error uploading file: ${error.message}`,
        error.stack,
      );
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Unable to upload file. Please try again later.',
      );
    }
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
