import {
  IsString,
  IsNumber,
  IsNotEmpty,
  MinLength,
  MaxLength,
  Min,
  IsEnum,
  Matches,
  Max,
  IsEmail,
} from 'class-validator';
import { Platform } from "../../../enums/platform.enum";
import { Niche } from "../../../enums/niche.enum";




export class RegisterClipperDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  fullName: string;

  @IsString()
  @IsNotEmpty({ message: 'Brand name is required' })
  @MinLength(2)
  @MaxLength(50)
  brandName: string;

  @IsEmail({}, { message: 'Invalid email address' })
  @MaxLength(100)
  @MinLength(2)
  @MaxLength(50)
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(50)
  @Matches(/^[a-zA-Z0-9_.]+$/, {
    message:
      'Social media handle should only contain letters, numbers, underscores, and periods',
  })
  socialMediaHandle: string;

  @IsEnum(Platform, {
    message: 'Platform must be one of: instagram, tiktok, youtube, x',
  })
  platform: Platform;

  @IsEnum(Niche, {
    message:
      'Niche must be one of: travel, food, entertainment, sport, fashion, technology, gaming, beauty, fitness, other',
  })
  niche: Niche;

  @IsString()
  @IsNotEmpty()
  country: string;

  @IsNumber()
  @Min(0)
  @Max(500000000)
  followerCount: number;

  @IsNumber()
  @Min(0)
  @Max(500000000)
  pricePerPost: number;

  @IsString()
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/, {
    message:
      'Password must contain at least one letter, one number, and be at least 8 characters long',
  })
  password: string;

}
