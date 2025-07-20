import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  Logger,
  InternalServerErrorException,
  ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  OnboardingData,
  CompleteOnboardingDto,
} from './dtos/google-onboarding.dto';
import { AuthService } from './auth.service';
import { CreatorsService } from '../creators/creators.service';
import { ClippersService } from '../clippers/clippers.service';
import { UserResponse } from '../interfaces/user-auth-response.interface';
import { AuthResponse } from './interfaces/auth-response.interface';

@Injectable()
export class GoogleOnboardingService {
  private readonly logger = new Logger(GoogleOnboardingService.name);
  private onboardingCache = new Map<string, OnboardingData>();

  constructor(
    private configService: ConfigService,
    private authService: AuthService,
    private creatorsService: CreatorsService,
    private clippersService: ClippersService,
  ) {}

  generateOnboardingToken(userData: {
    email: string;
    name: string;
    picture: string;
    role: 'creator' | 'clipper';
  }): string {
    const onboardingData: OnboardingData = {
      email: userData.email,
      name: userData.name,
      picture: userData.picture,
      role: userData.role,
      completedSteps: 0,
    };

    // Generate a simple unique token for onboarding session
    const token = `onboarding_${userData.email}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Store with expiration (1 hour = 3600000ms)
    setTimeout(() => {
      this.onboardingCache.delete(token);
    }, 3600000);

    this.onboardingCache.set(token, onboardingData);
    return token;
  }

  private validateOnboardingToken(token: string): OnboardingData {
    const data = this.onboardingCache.get(token);

    if (!data) {
      throw new UnauthorizedException('Invalid or expired onboarding token');
    }

    return data;
  }

  async completeOnboarding(dto: CompleteOnboardingDto): Promise<any> {
    const onboardingData = this.validateOnboardingToken(dto.onboardingToken);

    // We no longer need to validate completed steps since we're getting all data at once
    // We just need the basic Google user info (email, name, picture) from the cache
    
    try {
      let response: any;

      if (dto.role === 'creator') {
        const creatorData = {
          fullName: onboardingData.name, // From Google OAuth
          brandName: dto.brandName, // From DTO
          email: onboardingData.email, // From Google OAuth
          socialMediaHandle: dto.socialMediaHandle, // From DTO
          platform: dto.platform, // From DTO
          niche: dto.niche, // From DTO
          country: dto.country, // From DTO
          password: dto.password, // From DTO
        };
        
        // Create auth user first
        const authData = await this.authService.register({
          email: creatorData.email,
          password: creatorData.password,
        });

        if (!authData?.id) {
          throw new InternalServerErrorException('Auth registration failed');
        }

        try {
          // Create creator profile
          const { password, ...profileData } = creatorData;
          const userProfile = await this.creatorsService.create({
            id: authData.id,
            ...profileData,
            brandProfilePicture: null,
          });

          response = {
            user: userProfile,
            role: 'creator',
            token: authData.token,
            refreshToken: authData.refreshToken,
          };
        } catch (error) {
          // Rollback auth user if profile creation fails
          await this.authService.deleteUser(authData.id);
          throw error;
        }
      } else {
        const clipperData = {
          fullName: onboardingData.name, // From Google OAuth
          brandName: dto.brandName, // From DTO
          email: onboardingData.email, // From Google OAuth
          socialMediaHandle: dto.socialMediaHandle, // From DTO
          platform: dto.platform, // From DTO
          niche: dto.niche, // From DTO
          country: dto.country, // From DTO
          followerCount: dto.followerCount!, // From DTO
          pricePerPost: dto.pricePerPost!, // From DTO
          password: dto.password, // From DTO
        };
        
        // Create auth user first
        const authData = await this.authService.register({
          email: clipperData.email,
          password: clipperData.password,
        });

        if (!authData?.id) {
          throw new InternalServerErrorException('Auth registration failed');
        }

        try {
          // Create clipper profile
          const { password, ...profileData } = clipperData;
          const clipperProfile = await this.clippersService.create({
            id: authData.id,
            brandProfilePicture: null,
            ...profileData,
          });

          response = {
            user: clipperProfile,
            role: 'clipper',
            token: authData.token,
            refreshToken: authData.refreshToken,
          };
        } catch (error) {
          // Rollback auth user if profile creation fails
          await this.authService.deleteUser(authData.id);
          throw error;
        }
      }

      // Clean up onboarding data
      this.onboardingCache.delete(dto.onboardingToken);

      return response;
    } catch (error) {
      this.logger.error(
        `Onboarding completion failed: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  getOnboardingStatus(token: string): {
    currentStep: number;
    totalSteps: number;
    role: string;
  } {
    const onboardingData = this.validateOnboardingToken(token);

    return {
      currentStep: onboardingData.completedSteps,
      totalSteps: onboardingData.role === 'creator' ? 4 : 5,
      role: onboardingData.role,
    };
  }
}
