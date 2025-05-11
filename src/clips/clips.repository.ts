import {
  Injectable,
  NotFoundException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { ClipSubmission } from '../interfaces/clip-submission.interface';
import { ClipStatus } from '../enums/clip-status.enum';

@Injectable()
export class ClipsRepository {
  private readonly logger = new Logger(ClipsRepository.name);
  constructor(private readonly supabaseService: SupabaseService) {}

  async createClipSubmission(
    creatorId: string,
    clipUrl: string,
    description: string,
    clipperId: string,
    thumbnailUrl?: string,
  ): Promise<ClipSubmission> {
    const { data, error } = await this.supabaseService.client
      .from('clip_submissions')
      .insert({
        creator_id: creatorId,
        clipper_id: clipperId,
        clip_url: clipUrl,
        thumbnail_url: thumbnailUrl,
        description,
        status: ClipStatus.PENDING,
      })
      .select('*')
      .single();

    if (error) {
      this.logger.error(`Failed to create clip submission: ${error.message}`);
      throw new InternalServerErrorException(
        `Failed to create clip submission: ${error.message}`,
      );
    }

    return this.mapToClipSubmission(data);
  }

  async updateClipStatus(
    clipId: string,
    status: ClipStatus,
    clipperId: string,
  ): Promise<ClipSubmission> {
    const { data, error } = await this.supabaseService.client
      .from('clip_submissions')
      .update({
        status,
        clipper_id: clipperId,
        updated_at: new Date(),
      })
      .eq('id', clipId)
      .select('*')
      .single();

    if (error) {
      this.logger.error(`Failed to update clip status: ${error.message}`);
      throw new InternalServerErrorException(
        `Failed to update clip status: ${error.message}`,
      );
    }

    if (!data) {
      throw new NotFoundException(`Clip with ID ${clipId} not found`);
    }

    return this.mapToClipSubmission(data);
  }

  async getClipSubmissionsByCreatorId(
    creatorId: string,
  ): Promise<ClipSubmission[]> {
    const { data, error } = await this.supabaseService.client
      .from('clip_submissions')
      .select('*')
      .eq('creator_id', creatorId);

    if (error) {
      this.logger.error(
        `Failed to get clip submissions by creator ID: ${error.message}`,
      );
      if (error.code === 'PGRST116') {
        return [];
      }
      throw new InternalServerErrorException(
        `Failed to get clip submissions by creator ID: ${error.message}`,
      );
    }

    return data.map(this.mapToClipSubmission);
  }

  async getClipSubmissionsByClipperId(
    clipperId: string,
  ): Promise<ClipSubmission[]> {
    const { data, error } = await this.supabaseService.client
      .from('clip_submissions')
      .select('*')
      .eq('clipper_id', clipperId);

    if (error) {
      this.logger.error(
        `Failed to get clip submissions by clipper ID: ${error.message}`,
      );
      if (error.code === 'PGRST116') {
        return [];
      }
      throw new InternalServerErrorException(
        `Failed to get clip submissions by clipper ID: ${error.message}`,
      );
    }

    return data.map(this.mapToClipSubmission);
  }

  async getClipSubmissionById(clipId: string): Promise<ClipSubmission> {
    const { data, error } = await this.supabaseService.client
      .from('clip_submissions')
      .select('*')
      .eq('id', clipId)
      .single();

    if (error) {
      this.logger.error(
        `Failed to get clip submissions by creator ID: ${error.message}`,
      );
      throw new InternalServerErrorException(
        `Failed to get clip submission by ID: ${error.message}`,
      );
    }

    if (!data) {
      throw new NotFoundException(`Clip with ID ${clipId} not found`);
    }

    return this.mapToClipSubmission(data);
  }

  async deleteClipFromStorage(clipUrl: string): Promise<void> {
    try {
      // Extract bucket and path information from the URL
      // Example URL format: https://xxx.supabase.co/storage/v1/object/public/bucket-name/path/to/file.mp4
      const urlParts = clipUrl.split('/object/public/');
      if (urlParts.length < 2) {
        throw new Error(`Invalid storage URL format: ${clipUrl}`);
      }

      const [bucket, ...pathParts] = urlParts[1].split('/');
      const filePath = pathParts.join('/');

      // Delete from Supabase storage
      const { error } = await this.supabaseService.client.storage
        .from(bucket)
        .remove([filePath]);

      if (error) {
        this.logger.error(
          `Failed to delete clip from storage: ${error.message}`,
        );
        throw new InternalServerErrorException(
          `Failed to delete clip from storage: ${error.message}`,
        );
      }
    } catch (error) {
      console.error(`Error during storage cleanup: ${error.message}`);
      throw new Error(`Failed to clean up storage: ${error.message}`);
    }
  }

  /**
   * Rollback a clip submission by deleting the uploaded file from storage
   * Use this when the database insertion fails but the file was already uploaded
   */
  async rollbackClipSubmission(clipUrl: string): Promise<void> {
    try {
      await this.deleteClipFromStorage(clipUrl);
    } catch (error) {
      console.error(`Rollback operation failed: ${error.message}`);
      // We don't rethrow here as this is already a recovery operation
      // Just log the error, so the main error (DB insertion failure) is still propagated
    }
  }

  private mapToClipSubmission(data: any): ClipSubmission {
    return {
      id: data.id,
      creatorId: data.creator_id,
      clipperId: data.clipper_id,
      description: data.description,
      clipUrl: data.clip_url,
      thumbnailUrl: data.thumbnail_url,
      status: data.status,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }
}
