import { IsNotEmpty, IsString, IsEnum } from 'class-validator';
import { ClipStatus } from '../enums/clip-status.enum';

export class UpdateClipStatusDto {
  @IsEnum(ClipStatus)
  @IsNotEmpty()
  status: ClipStatus;

  @IsString()
  @IsNotEmpty()
  clipId: string;
}
