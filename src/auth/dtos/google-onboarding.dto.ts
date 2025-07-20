import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsNumber,
  IsOptional,
  MinLength,
  MaxLength,
  Min,
  Max,
  Matches,
} from 'class-validator';
import { Platform } from '../../enums/platform.enum';
import { Niche } from '../../enums/niche.enum';

export class CompleteOnboardingDto {
  @IsString()
  @IsNotEmpty()
  onboardingToken: string;

  @IsEnum(['creator', 'clipper'], {
    message: 'Role must be either creator or clipper',
  })
  role: 'creator' | 'clipper';

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  brandName: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(50)
  @Matches(/^[a-zA-Z0-9_.]+$/, {
    message: 'Social media handle should only contain letters, numbers, underscores, and periods',
  })
  socialMediaHandle: string;

  @IsEnum(Platform, {
    message: 'Platform must be one of: instagram, tiktok, youtube, x',
  })
  platform: Platform;

  @IsEnum(Niche, {
    message: 'Niche must be one of: travel, food, entertainment, sport, fashion, technology, gaming, beauty, fitness, other',
  })
  niche: Niche;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  country: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/, {
    message: 'Password must contain at least one letter, one number, and be at least 8 characters long',
  })
  password: string;

  // Optional clipper-specific fields
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(500000000)
  followerCount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(500000000)
  pricePerPost?: number;
}

export interface OnboardingData {
  email: string;
  name: string;
  picture: string;
  role: 'creator' | 'clipper';
  brandName?: string;
  socialMediaHandle?: string;
  platform?: Platform;
  niche?: Niche;
  country?: string;
  followerCount?: number;
  pricePerPost?: number;
  completedSteps: number;
}

export interface OnboardingStepResponse {
  success: boolean;
  message: string;
  nextStep?: number;
  totalSteps: number;
  currentStep: number;
}