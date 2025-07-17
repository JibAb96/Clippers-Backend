import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  Logger,
  InternalServerErrorException
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  OnboardingData,
  OnboardingRoleSelectionDto,
  OnboardingStep1Dto,
  OnboardingStep2Dto,
  OnboardingStep3Dto,
  OnboardingStep4ClipperDto,
  CompleteOnboardingDto,
  OnboardingStepResponse,
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

  private updateOnboardingData(
    token: string,
    updates: Partial<OnboardingData>,
  ): void {
    const currentData = this.validateOnboardingToken(token);
    const updatedData = { ...currentData, ...updates };
    this.onboardingCache.set(token, updatedData);
  }

  async processRoleSelection(dto: OnboardingRoleSelectionDto): Promise<OnboardingStepResponse> {
    const onboardingData = this.validateOnboardingToken(dto.onboardingToken);

    if (onboardingData.completedSteps >= 1) {
      throw new BadRequestException('Role selection already completed');
    }

    this.updateOnboardingData(dto.onboardingToken, {
      role: dto.role,
      completedSteps: 1,
    });

    return {
      success: true,
      message: 'Role selected successfully',
      nextStep: 2,
      totalSteps: dto.role === 'creator' ? 5 : 6,
      currentStep: 1,
    };
  }

  async processStep1(dto: OnboardingStep1Dto): Promise<OnboardingStepResponse> {
    const onboardingData = this.validateOnboardingToken(dto.onboardingToken);

    if (onboardingData.completedSteps < 1) {
      throw new BadRequestException('Role selection must be completed first');
    }

    if (onboardingData.completedSteps >= 2) {
      throw new BadRequestException('Step 1 already completed');
    }

    this.updateOnboardingData(dto.onboardingToken, {
      brandName: dto.brandName,
      completedSteps: 2,
    });

    return {
      success: true,
      message: 'Brand name saved successfully',
      nextStep: 3,
      totalSteps: onboardingData.role === 'creator' ? 4 : 5,
      currentStep: 2,
    };
  }

  async processStep2(dto: OnboardingStep2Dto): Promise<OnboardingStepResponse> {
    const onboardingData = this.validateOnboardingToken(dto.onboardingToken);

    if (onboardingData.completedSteps < 2) {
      throw new BadRequestException('Previous steps must be completed first');
    }

    if (onboardingData.completedSteps >= 3) {
      throw new BadRequestException('Step 2 already completed');
    }

    this.updateOnboardingData(dto.onboardingToken, {
      socialMediaHandle: dto.socialMediaHandle,
      platform: dto.platform,
      completedSteps: 3,
    });

    return {
      success: true,
      message: 'Social media details saved successfully',
      nextStep: 4,
      totalSteps: onboardingData.role === 'creator' ? 4 : 5,
      currentStep: 3,
    };
  }

  async processStep3(dto: OnboardingStep3Dto): Promise<OnboardingStepResponse> {
    const onboardingData = this.validateOnboardingToken(dto.onboardingToken);

    if (onboardingData.completedSteps < 3) {
      throw new BadRequestException('Previous steps must be completed first');
    }

    if (onboardingData.completedSteps >= 4) {
      throw new BadRequestException('Step 3 already completed');
    }

    this.updateOnboardingData(dto.onboardingToken, {
      niche: dto.niche,
      country: dto.country,
      completedSteps: 4,
    });

    const nextStep = onboardingData.role === 'creator' ? 5 : 5;
    return {
      success: true,
      message: 'Niche and location details saved successfully',
      nextStep,
      totalSteps: onboardingData.role === 'creator' ? 5 : 6,
      currentStep: 4,
    };
  }

  async processStep4Clipper(
    dto: OnboardingStep4ClipperDto,
  ): Promise<OnboardingStepResponse> {
    const onboardingData = this.validateOnboardingToken(dto.onboardingToken);

    if (onboardingData.role !== 'clipper') {
      throw new BadRequestException('This step is only for clippers');
    }

    if (onboardingData.completedSteps < 4) {
      throw new BadRequestException('Previous steps must be completed first');
    }

    if (onboardingData.completedSteps >= 5) {
      throw new BadRequestException('Step 4 already completed');
    }

    this.updateOnboardingData(dto.onboardingToken, {
      followerCount: dto.followerCount,
      pricePerPost: dto.pricePerPost,
      completedSteps: 5,
    });

    return {
      success: true,
      message: 'Follower and pricing details saved successfully',
      nextStep: 6,
      totalSteps: 6,
      currentStep: 5,
    };
  }

  async completeOnboarding(dto: CompleteOnboardingDto): Promise<any> {
    const onboardingData = this.validateOnboardingToken(dto.onboardingToken);

    const requiredSteps = onboardingData.role === 'creator' ? 4 : 5;
    if (onboardingData.completedSteps < requiredSteps) {
      throw new BadRequestException(
        'All previous steps must be completed first',
      );
    }

    try {
      let response: any;

      if (onboardingData.role === 'creator') {
        const creatorData = {
          fullName: onboardingData.name,
          brandName: onboardingData.brandName!,
          email: onboardingData.email,
          socialMediaHandle: onboardingData.socialMediaHandle!,
          platform: onboardingData.platform!,
          niche: onboardingData.niche!,
          country: onboardingData.country!,
          password: dto.password,
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
          fullName: onboardingData.name,
          brandName: onboardingData.brandName!,
          email: onboardingData.email,
          socialMediaHandle: onboardingData.socialMediaHandle!,
          platform: onboardingData.platform!,
          niche: onboardingData.niche!,
          country: onboardingData.country!,
          followerCount: onboardingData.followerCount!,
          pricePerPost: onboardingData.pricePerPost!,
          password: dto.password,
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
