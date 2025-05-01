import {
  Injectable,
  Logger,
} from '@nestjs/common';
import { AuthRepository } from './auth.repository';
import { AuthDto } from './dtos/auth.dto';
import { AuthResponse } from './interfaces/auth-response.interface';
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(private readonly authRepository: AuthRepository) {}

  async register(authDto: AuthDto): Promise<AuthResponse> {
    try {
      const response = await this.authRepository.register(
        authDto.email,
        authDto.password,
      );
      return response
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

      return response
    } catch (error) {
      this.logger.error(`Login failed: ${error.message}`, error.stack);
      throw error;
    }
  }
  async deleteUser(id: string): Promise<void> {
    await this.authRepository.deleteUser(id);
  }
}
