import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { SupabaseAuthClientService } from '../supabase/supabase-auth-client.service';
import { RequestWithUser } from '../interfaces/auth-request.interface';

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  private readonly logger = new Logger(SupabaseAuthGuard.name);

  constructor(
    private readonly supabaseAuthClientService: SupabaseAuthClientService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      this.logger.warn('Missing or invalid Authorization Bearer header.');
      throw new UnauthorizedException('Missing or invalid token');
    }

    const token = authHeader.split(' ')[1];

    try {
      const { data, error } =
        await this.supabaseAuthClientService.client.auth.getUser(token);

      if (error) {
        this.logger.warn(
          `Token validation error: ${error.message}`,
          error.stack,
        );
        throw new UnauthorizedException('Invalid token');
      }
      if (!data || !data.user) {
        this.logger.warn('Token validation returned no user data.');
        throw new UnauthorizedException('Invalid token, no user data found.');
      }

      (request as RequestWithUser).user = {
        id: data.user.id,
        email: data.user.email,
      };
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(
        `Unexpected error during token validation: ${error.message}`,
        error.stack,
      );
      throw new UnauthorizedException(
        'Invalid token due to an unexpected error.',
      );
    }
  }
}
