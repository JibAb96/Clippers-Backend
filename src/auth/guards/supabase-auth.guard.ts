import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { SupabaseService } from "../../supabase/supabase.service"
import { RequestWithUser } from "../interfaces/auth-request.interface";

@Injectable()
export class SupabaseAuthGuard implements CanActivate {

  constructor(private readonly supabaseService: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid token');
    }

    const token = authHeader.split(' ')[1];

    try {
      const { data, error } = await this.supabaseService.client.auth.getUser(token);

      if (error || !data.user) {
        throw new UnauthorizedException('Invalid token');
      }
       (request as RequestWithUser).user = {
         id: data.user.id,
         email: data.user.email,
       };
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}