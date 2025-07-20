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

  /**
   * Creates a Supabase client with user authentication context for RLS policies
   * @param userToken The JWT token of the authenticated user
   * @returns A Supabase client with user context
   */
  async getUserAuthenticatedClient(userToken: string): Promise<SupabaseClient> {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_KEY');
    
    const userClient = createClient(supabaseUrl || '', supabaseKey || '', {
      auth: {
        persistSession: false,
      },
    });
    
    // Set the session with the user's JWT token for RLS policies
    await userClient.auth.setSession({
      access_token: userToken,
      refresh_token: '', // Not needed for our use case
    });
    
    return userClient;
  }

  async uploadFile(
    file: Express.Multer.File,
    bucket: string,
    path: string,
    userToken?: string,
  ): Promise<string> {
      // Use user-authenticated client if token is provided, otherwise use service client
      const client = userToken 
        ? await this.getUserAuthenticatedClient(userToken)
        : this.supabaseClient;

      const { error } = await client.storage
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
      } = client.storage.from(bucket).getPublicUrl(path);
      return publicUrl;
    
  }

  async deleteFile(bucket: string, path: string, userToken?: string): Promise<void> {
    try {
      // Use user-authenticated client if token is provided, otherwise use service client
      const client = userToken 
        ? await this.getUserAuthenticatedClient(userToken)
        : this.supabaseClient;

      const { data, error } = await client.storage
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
