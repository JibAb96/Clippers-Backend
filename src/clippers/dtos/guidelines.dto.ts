import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';

export class CreateGuidelineDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(200)
  guideline: string;
}