import {
  Controller,
  Post,
  UseGuards,
  Body,
  UploadedFiles,
  UseInterceptors,
  Get,
  Param,
  Patch,
} from '@nestjs/common';
import { ClipsService } from './clips.service';
import { SupabaseAuthGuard } from '../guards/supabase-auth.guard';
import {
  FileFieldsInterceptor,
} from '@nestjs/platform-express';
import { SubmitClipDto } from '../dtos/submit-clip.dto';
import { UpdateClipStatusDto } from '../dtos/update-clip-status.dto';
import { ClipSubmission } from '../interfaces/clip-submission.interface';
import { CurrentUser } from '../decorators/current-user.decorator';
import { SupabaseUser } from '../interfaces/auth-request.interface';
import { ApiResponse } from '../interfaces/api.interface';
import { ClipFileDto } from 'src/dtos/submit-clip-files.dto';
import { ThumbnailValidationPipe } from './pipes/thumbnail-validation.pipe';
import { ClipValidationPipe } from "./pipes/clip-validation.pipe"

@Controller('clips')
@UseGuards(SupabaseAuthGuard)
export class ClipsController {
  constructor(
    private readonly clipsService: ClipsService
  ) {}

  @Post('submit')
  @UseInterceptors(
    FileFieldsInterceptor([
      {
        name: 'clip',
        maxCount: 1,
      },
      {
        name: 'thumbnail',
        maxCount: 1,
      },
    ]),
  )
  async submitClip(
    @UploadedFiles()
    files: ClipFileDto,
    @Body() submitClipDto: SubmitClipDto,
    @CurrentUser() user: SupabaseUser,
  ): Promise<ApiResponse<ClipSubmission>> {
    const clipValidationPipe = new ClipValidationPipe();
    const thumbnailValidationPipe = new ThumbnailValidationPipe();
    const thumbnailFile = await thumbnailValidationPipe.transform(
      files.thumbnail[0],
    );
    const clipFile = await clipValidationPipe.transform(files.clip[0])
    const result = await this.clipsService.submitClip(
      clipFile,
      thumbnailFile,
      submitClipDto,
      user.id,
    );

    return {
      status: 'success',
      data: result,
      message: 'Clip submitted successfully',
    };
  }

  @Patch('status')
  async updateClipStatus(
    @Body() updateClipStatusDto: UpdateClipStatusDto,
    @CurrentUser() user: SupabaseUser,
  ): Promise<ApiResponse<ClipSubmission>> {
    const result = await this.clipsService.updateClipStatus(
      updateClipStatusDto,
      user.id,
    );
    return {
      status: 'success',
      data: result,
      message: 'Clip status updated successfully',
    };
  }

  @Get('get-by-creatorId')
  async getClipSubmissionsByCreatorId(
    @CurrentUser() user: SupabaseUser,
  ): Promise<ApiResponse<ClipSubmission[]>> {
    const result = await this.clipsService.getClipSubmissionsByCreatorId(
      user.id,
    );
    return {
      status: 'success',
      data: result,
      message: 'Creator clip submissions fetched successfully',
    };
  }

  @Get('get-by-clipperId')
  async getClipSubmissionsByClipperId(
    @CurrentUser() user: SupabaseUser,
  ): Promise<ApiResponse<ClipSubmission[]>> {
    const result = await this.clipsService.getClipSubmissionsByClipperId(
      user.id,
    );
    return {
      status: 'success',
      data: result,
      message: 'Clipper submissions fetched successfully',
    };
  }

  @Get('/:id')
  async getClipSubmissionById(
    @Param('id') id: string,
    @CurrentUser() user: SupabaseUser,
  ): Promise<ApiResponse<ClipSubmission>> {
    const result = await this.clipsService.getClipSubmissionById(id, user.id);
    return {
      status: 'success',
      data: result,
      message: 'Clip submission fetched successfully',
    };
  }
}
