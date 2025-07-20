import { IsString, IsNotEmpty, IsEmail, IsEnum, IsOptional } from 'class-validator';

export class GoogleAuthDto {
  @IsString()
  @IsNotEmpty()
  idToken: string;
}

export class GoogleCallbackDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsOptional()
  state?: string;
}

export class InitiateOnboardingDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  picture: string;

  @IsEnum(['creator', 'clipper'])
  @IsNotEmpty()
  role: 'creator' | 'clipper';
}

export interface GoogleAuthResponse {
  requiresOnboarding: boolean;
  user?: {
    id: string;
    email: string;
    role: string;
    profile: any;
  };
  onboardingToken?: string;
  token?: string;
  refreshToken?: string;
}