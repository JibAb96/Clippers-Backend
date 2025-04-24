import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { SupabaseService } from 'src/supabase/supabase.service';

@Injectable()
export class AuthRepository {
  constructor(private supabaseService: SupabaseService) {}
  private readonly logger = new Logger(AuthRepository.name);

  async register(email: string, password: string) {
    console.log('Raw email input:', email);
    console.log('Email after trim:', email.trim());
    const { data, error } = await this.supabaseService.client.auth.signUp({
      email,
      password,
    });

    if (error) {
      this.logger.error(`Registration failed: ${error.message}`, error.stack);
      throw new InternalServerErrorException(
        'There was an internal server error during registration',
      );
    }
    return data;
  }

  async login(email: string, password: string) {
    const { data, error } =
      await this.supabaseService.client.auth.signInWithPassword({
        email,
        password,
      });

    if (error) {
      this.logger.error(`Login failed: ${error.message}`, error.stack);
      if (error.message === 'Email not confirmed') {
        throw new BadRequestException(
          'Email not confirmed. Please check your email for the confirmation link.')
      }

      throw new InternalServerErrorException(
        'There was an internal server error during registration',
      );
    }

    return data;
  }

  async deleteUser(id: string) {
    const { error } =
      await this.supabaseService.client.auth.admin.deleteUser(id);
    if (error) {
      this.logger.error(`Deleting user failed: ${error.message}`, error.stack);
      throw new InternalServerErrorException(
        'There was an internal server error while deleting user',
      );
    }
  }
}
