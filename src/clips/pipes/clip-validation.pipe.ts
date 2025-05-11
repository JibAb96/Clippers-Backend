import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import {
  FileTypeValidator,
  MaxFileSizeValidator,
  ParseFilePipe,
} from '@nestjs/common';

@Injectable()
export class ClipValidationPipe implements PipeTransform {
  async transform(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Clip file is required');
    }

    const clipPipe = new ParseFilePipe({
      validators: [
        new FileTypeValidator({
            fileType: /(mp4|webm|ogg|quicktime|x-msvideo|x-matroska|mpeg)/,
          }),
        new MaxFileSizeValidator({ maxSize: 104857600 }), // 100MB
      ],
    });

    try {
      return await clipPipe.transform(file);
    } catch (error) {
      throw new BadRequestException(
        `Clip validation failed: ${error.message}`,
      );
    }
  }
}
