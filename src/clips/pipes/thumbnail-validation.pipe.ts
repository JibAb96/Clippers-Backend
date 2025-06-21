import {
  PipeTransform,
  Injectable,
  BadRequestException,
  FileTypeValidator,
  MaxFileSizeValidator,
  ParseFilePipe,
} from '@nestjs/common';

@Injectable()
export class ThumbnailValidationPipe implements PipeTransform {
  async transform(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Thumbnail file is required');
    }

    const thumbnailPipe = new ParseFilePipe({
      validators: [
        new FileTypeValidator({
          fileType: /(jpeg|jpg|png|gif|webp)/,
        }),
        new MaxFileSizeValidator({ maxSize: 2097152 }), // 2MB
      ],
    });

    try {
      return await thumbnailPipe.transform(file);
    } catch (error) {
      throw new BadRequestException(
        `Thumbnail validation failed: ${error.message}`,
      );
    }
  }
}
