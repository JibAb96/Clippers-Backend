import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsEnum,
  MinLength,
  Matches,
  MaxLength,
} from 'class-validator';
import { Platform } from '../../../enums/platform.enum';
import { Niche } from '../../../enums/niche.enum';
import { Expose } from 'class-transformer';
export class UpdateCreatorDto {
  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  @MinLength(2)
  @MaxLength(50)
  name?: string;

  @IsString()
  @IsNotEmpty({ message: 'Brand name is required' })
  @MinLength(2)
  @MaxLength(50)
  @Expose({ name: 'brand_name' })
  brandName?: string;

  @IsEmail({}, { message: 'Invalid email address' })
  @MaxLength(100)
  @MinLength(2)
  @MaxLength(50)
  email?: string;

  @IsString()
  @Expose({ name: 'social_media_handle' })
  socialMediaHandle?: string;

  @IsEnum(Platform, {
    message: 'Platform must be either "YouTube", "Instagram", "X", "Tiktok"',
  })
  platform?: string;

  @IsEnum(Niche, {
    message:
      'Niche must be from  "Gaming", "Sport", "Fashion", "Beauty", "Technology", "Fitness", "Travel", "Entertainment", "Food" or "Other"',
  })
  niche?: string;

  @IsString()
  @IsNotEmpty({ message: 'Country is required' })
  @MinLength(2)
  @MaxLength(50)
  country?: string;

  @IsString()
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/, {
    message:
      'Password must contain at least one letter, one number, and be at least 8 characters long',
  })
  password?: string;


}
