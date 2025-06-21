import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { SupabaseAuthClientService } from '../supabase/supabase-auth-client.service';
import { AuthResponse } from './interfaces/auth-response.interface';

@Injectable()
export class AuthRepository {
  private readonly logger = new Logger(AuthRepository.name);

  constructor(
    private supabaseService: SupabaseService,
    private supabaseAuthClientService: SupabaseAuthClientService,
  ) {}

  async register(email: string, password: string): Promise<AuthResponse> {
    console.log('Raw email input:', email);
    console.log('Email after trim:', email.trim());
    const { data, error } =
      await this.supabaseAuthClientService.client.auth.signUp({
        email,
        password,
      });

    if (error) {
      this.logger.error(`Registration failed: ${error.message}`, error.stack);
      if (error.message == 'User already registered') {
        throw new InternalServerErrorException('User already registered');
      }
      throw new InternalServerErrorException(
        'There was an internal server error during registration',
      );
    }
    return {
      id: data.user?.id,
      token: data.session?.access_token,
      refreshToken: data.session?.refresh_token,
    };
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const { data, error } =
      await this.supabaseAuthClientService.client.auth.signInWithPassword({
        email,
        password,
      });

    if (error) {
      this.logger.error(`Login failed: ${error.message}`, error.stack);
      if (error.message === 'Email not confirmed') {
        throw new BadRequestException(
          'Email not confirmed. Please check your email for the confirmation link.',
        );
      }
      if (error.message === 'Invalid login credentials') {
        throw error;
      }
      throw new InternalServerErrorException(
        'There was an internal server error during login process.',
      );
    }

    if (!data || !data.user || !data.session) {
      this.logger.error('Login response missing user or session data.');
      throw new InternalServerErrorException(
        'Invalid login response from authentication service.',
      );
    }

    return {
      id: data.user.id,
      token: data.session.access_token,
      refreshToken: data.session.refresh_token,
    };
  }

  async deleteUser(id: string): Promise<void> {
    const { error } =
      await this.supabaseService.client.auth.admin.deleteUser(id);
    if (error) {
      this.logger.error(`Deleting user failed: ${error.message}`, error.stack);
      throw new InternalServerErrorException(
        'There was an internal server error while deleting user',
      );
    }
  }

  async changePassword(password: string): Promise<void> {
    const { error } =
      await this.supabaseAuthClientService.client.auth.updateUser({
        password: password,
      });
    if (error) {
      this.logger.error(
        `Changing password failed: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'There was an internal server error while changing password',
      );
    }
  }
}
