import {
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
  ValidateNested,
  IsNotEmpty,
} from 'class-validator';

export class ClipFileDto {
  @IsArray()
  @ValidateNested({ each: true })
  @IsNotEmpty()
  clip: Express.Multer.File;

  @IsArray()
  @ValidateNested({ each: true })
  @IsNotEmpty()
  thumbnail: Express.Multer.File;
}
