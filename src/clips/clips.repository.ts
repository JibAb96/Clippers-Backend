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
    title?: string,
    userToken?: string,
  ): Promise<ClipSubmission> {
    // Use user-authenticated client if token is provided, otherwise use service client
    const client = userToken
      ? await this.supabaseService.getUserAuthenticatedClient(userToken)
      : this.supabaseService.client;

    const { data, error } = await client
      .from('clip_submissions')
      .insert({
        creator_id: creatorId,
        clipper_id: clipperId,
        clip_url: clipUrl,
        thumbnail_url: thumbnailUrl,
        description,
        title,
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
    userToken?: string,
  ): Promise<ClipSubmission> {
    // Use user-authenticated client if token is provided, otherwise use service client
    const client = userToken
      ? await this.supabaseService.getUserAuthenticatedClient(userToken)
      : this.supabaseService.client;

    const { data, error } = await client
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
    userToken?: string,
  ): Promise<ClipSubmission[]> {
    // Use user-authenticated client if token is provided, otherwise use service client
    const client = userToken
      ? await this.supabaseService.getUserAuthenticatedClient(userToken)
      : this.supabaseService.client;

    const { data, error } = await client
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
    userToken?: string,
  ): Promise<ClipSubmission[]> {
    // Use user-authenticated client if token is provided, otherwise use service client
    const client = userToken 
      ? await this.supabaseService.getUserAuthenticatedClient(userToken)
      : this.supabaseService.client;

    const { data, error } = await client
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

  async getClipSubmissionById(clipId: string, userToken?: string): Promise<ClipSubmission> {
    // Use user-authenticated client if token is provided, otherwise use service client
    const client = userToken 
      ? await this.supabaseService.getUserAuthenticatedClient(userToken)
      : this.supabaseService.client;

    const { data, error } = await client
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
   Rollback a clip submission by deleting the uploaded file from storage
   */
  async rollbackClipSubmission(clipUrl: string): Promise<void> {
    try {
      await this.deleteClipFromStorage(clipUrl);
    } catch (error) {
      console.error(`Rollback operation failed: ${error.message}`);
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
      title: data.title,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }
}
