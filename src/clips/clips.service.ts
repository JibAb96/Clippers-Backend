import { Injectable, ForbiddenException, Logger } from '@nestjs/common';
import { ClipsRepository } from './clips.repository';
import { SupabaseService } from '../supabase/supabase.service';
import { ClipSubmission } from '../interfaces/clip-submission.interface';
import { SubmitClipDto } from '../dtos/submit-clip.dto';
import { UpdateClipStatusDto } from '../dtos/update-clip-status.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ClipsService {
  private readonly logger = new Logger(ClipsService.name);

  constructor(
    private readonly clipsRepository: ClipsRepository,
    private readonly supabaseService: SupabaseService,
  ) {}

  async submitClip(
    clipFile: Express.Multer.File,
    thumbnailFile: Express.Multer.File,
    submitClipDto: SubmitClipDto,
    userId: string,
    userToken?: string,
  ): Promise<ClipSubmission> {
    let clipUrl: string | undefined;
    let thumbnailUrl: string | undefined;

    try {
      // Generate a unique ID for this submission
      const submissionId = uuidv4();

      // Generate a unique file path for the clip
      const clipFileName = `${submissionId}-clip-${clipFile.originalname.replace(/\s+/g, '_')}`;
      const clipFilePath = `${submitClipDto.clipperId}/${clipFileName}`;

      // Upload the clip to Supabase storage with user context
      clipUrl = await this.supabaseService.uploadFile(
        clipFile,
        'clip-submissions',
        clipFilePath,
        userToken,
      );

      try {
        // Upload thumbnail with user context
        const thumbnailFileName = `${submissionId}-thumbnail-${thumbnailFile.originalname.replace(/\s+/g, '_')}`;
        const thumbnailFilePath = `${submitClipDto.clipperId}/${thumbnailFileName}`;

        thumbnailUrl = await this.supabaseService.uploadFile(
          thumbnailFile,
          'clip-thumbnails',
          thumbnailFilePath,
          userToken,
        );

        // Create the clip submission in the database with user context
        return this.clipsRepository.createClipSubmission(
          userId,
          clipUrl,
          submitClipDto.description,
          submitClipDto.clipperId,
          thumbnailUrl,
          submitClipDto.title,
          userToken,
        );
      } catch (error) {
        this.logger.error(
          `Failed during thumbnail upload or database insertion: ${error.message}`,
          error.stack,
        );

        // Rollback clip file if it was uploaded
        if (clipUrl) {
          await this.clipsRepository.rollbackClipSubmission(clipUrl);
        }

        throw error;
      }
    } catch (error) {
      this.logger.error(`Failed to submit clip: ${error.message}`, error.stack);
      throw error;
    }
  }

  async updateClipStatus(
    updateClipStatusDto: UpdateClipStatusDto,
    clipperId: string,
    userToken?: string,
  ): Promise<ClipSubmission> {
    try {
      return this.clipsRepository.updateClipStatus(
        updateClipStatusDto.clipId,
        updateClipStatusDto.status,
        clipperId,
        userToken,
      );
    } catch (error) {
      this.logger.error(
        `Failed to update clip status: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async getClipSubmissionsByCreatorId(
    creatorId: string,
    userToken?: string,
  ): Promise<ClipSubmission[]> {
    // Ensure the creator ID matches the authenticated user
    try {
      return this.clipsRepository.getClipSubmissionsByCreatorId(creatorId, userToken);
    } catch (error) {
      this.logger.error(
        `Failed to get creator clip submissions: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async getClipSubmissionsByClipperId(
    clipperId: string,
    userToken?: string,
  ): Promise<ClipSubmission[]> {
    try {
      return this.clipsRepository.getClipSubmissionsByClipperId(clipperId, userToken);
    } catch (error) {
      this.logger.error(
        `Failed to get clipper submissions: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async getClipSubmissionById(
    clipId: string,
    userId: string,
    userToken?: string,
  ): Promise<ClipSubmission> {
    try {
      const clip = await this.clipsRepository.getClipSubmissionById(clipId, userToken);
      // Ensure the user has permission to access this clip
      if (clip.creatorId !== userId && clip.clipperId !== userId) {
        throw new ForbiddenException(
          'You do not have permission to access this clip',
        );
      }
      return clip;
    } catch (error) {
      this.logger.error(
        `Failed to get clip submission: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
