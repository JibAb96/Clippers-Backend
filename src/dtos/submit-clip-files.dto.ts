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
  videoFile: Express.Multer.File;

  @IsArray()
  @ValidateNested({ each: true })
  @IsNotEmpty()
  thumbnailFile: Express.Multer.File;
}
