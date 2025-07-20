import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { AuthRepository } from './auth.repository';
import { AuthDto } from './dtos/auth.dto';
import { AuthResponse } from './interfaces/auth-response.interface';
import { GoogleOAuthService } from './google-oauth.service';
import { GoogleAuthResponse } from './dtos/google-oauth.dto';
import { SupabaseService } from '../supabase/supabase.service';
import { CreatorsService } from '../creators/creators.service';
import { ClippersService } from '../clippers/clippers.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly googleOAuthService: GoogleOAuthService,
    private readonly supabaseService: SupabaseService,
    private readonly creatorsService: CreatorsService,
    private readonly clippersService: ClippersService,
  ) {}

  async register(authDto: AuthDto): Promise<AuthResponse> {
    try {
      const response = await this.authRepository.register(
        authDto.email,
        authDto.password,
      );
      return response;
    } catch (error) {
      this.logger.error(`Registration failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async signin(authDto: AuthDto): Promise<AuthResponse> {
    try {
      const response = await this.authRepository.login(
        authDto.email,
        authDto.password,
      );

      return response;
    } catch (error) {
      this.logger.error(`Login failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async deleteUser(id: string): Promise<void> {
    await this.authRepository.deleteUser(id);
  }

  async changePassword(password: string): Promise<void> {
    try {
      await this.authRepository.changePassword(password);
    } catch (error) {
      this.logger.error(
        `Changing password failed in service: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async verifyGoogleToken(idToken: string) {
    return await this.googleOAuthService.verifyToken(idToken);
  }

  async createSupabaseSession(idToken: string) {
    const { data, error } =
      await this.supabaseService.client.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });

    if (error) {
      this.logger.error(
        `Supabase signInWithIdToken failed: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException(
        'Failed to create Supabase session from Google token',
      );
    }

    return data;
  }

  async checkUserExists(email: string): Promise<any> {
    try {
      const response = await this.authRepository.findUserExistsByEmail(email);
      return response || null;
    } catch (error) {
      this.logger.error(`Failed to check user existence: ${error.message}`);
      return null;
    }
  }

  async getUserProfile(
    userId: string,
  ): Promise<{ role: string; profile: any }> {
    try {
      const creatorProfile = await this.creatorsService.findOneById(userId);
      if (creatorProfile) {
        return { role: 'creator', profile: creatorProfile };
      }

      const clipperProfile = await this.clippersService.findOneById(userId);
      if (clipperProfile) {
        return { role: 'clipper', profile: clipperProfile };
      }

      throw new Error('User profile not found');
    } catch (error) {
      this.logger.error(`Failed to get user profile: ${error.message}`);
      throw error;
    }
  }
}
