import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import { ConfigService } from '@nestjs/config';

export interface GoogleUserInfo {
  email: string;
  name: string;
  picture: string;
  emailVerified: boolean;
  sub: string;
}

@Injectable()
export class GoogleOAuthService {
  private readonly logger = new Logger(GoogleOAuthService.name);
  private client: OAuth2Client;

  constructor(private configService: ConfigService) {
    this.client = new OAuth2Client(
      this.configService.get<string>('GOOGLE_CLIENT_ID'),
      this.configService.get<string>('GOOGLE_CLIENT_SECRET'),
      this.configService.get<string>('GOOGLE_REDIRECT_URI'),
    );
  }

  async verifyToken(token: string): Promise<GoogleUserInfo> {
    try {
      const ticket = await this.client.verifyIdToken({
        idToken: token,
        audience: this.configService.get<string>('GOOGLE_CLIENT_ID'),
      });

      const payload = ticket.getPayload();
      if (!payload) {
        throw new UnauthorizedException('Invalid Google token payload');
      }

      return {
        email: payload.email!,
        name: payload.name!,
        picture: payload.picture!,
        emailVerified: payload.email_verified!,
        sub: payload.sub,
      };
    } catch (error) {
      this.logger.error(
        `Google token verification failed: ${error.message}`,
        error.stack,
      );
      throw new UnauthorizedException('Invalid Google token');
    }
  }

  generateAuthUrl(): string {
    const state =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);

    return this.client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
      ],
      state: state,
    });
  }

  async getTokenFromCode(
    code: string,
  ): Promise<{ idToken: string; accessToken: string }> {
    try {
      const { tokens } = await this.client.getToken(code);

      if (!tokens.id_token || !tokens.access_token) {
        throw new UnauthorizedException(
          'Failed to retrieve tokens from Google',
        );
      }

      return {
        idToken: tokens.id_token,
        accessToken: tokens.access_token,
      };
    } catch (error) {
      this.logger.error(
        `Failed to exchange code for tokens: ${error.message}`,
        error.stack,
      );
      throw new UnauthorizedException('Failed to exchange authorization code');
    }
  }
}
