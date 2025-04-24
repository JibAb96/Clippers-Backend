import {
  IsString,
  IsNumber,
  IsNotEmpty,
  MinLength,
  MaxLength,
  Min,
  IsEnum,
  Matches,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
  ArrayNotEmpty,
  ValidateNested,
  Max,
  IsEmail,
} from 'class-validator';

export enum Platform {
  INSTAGRAM = 'instagram',
  TIKTOK = 'tiktok',
  YOUTUBE = 'youtube',
  X = 'x',
}
export enum Niche {
  TRAVEL = 'travel',
  ENTERTAINMENT = 'entertainment',
  FOOD = 'food',
  FITNESS = 'fitness',
  TECHNOLOGY = 'technology',
  BEAUTY = 'beauty',
  GAMING = 'gaming',
  SPORT = 'sport',
  FASHION = 'fashion',
  OTHER = 'other',
}

export class CreateClipperDto {
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
  platform: string;

  @IsEnum(Niche, {
    message:
      'Niche must be one of: travel, food, entertainment, sport, fashion, technology, gaming, beauty, fitness, other',
  })
  niche: string;

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

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(2)
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @MaxLength(50, { each: true })
  guidelines: string[];
}
