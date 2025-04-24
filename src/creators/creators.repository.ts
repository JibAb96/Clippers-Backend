import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { camelToSnake } from '../utility/camelToSnake';
import { CreatorProfileInterface } from '../interfaces/creator-profle.interface';
import { UploadFileResponse } from '../auth/interfaces/upload-response.interface';

@Injectable()
export class CreatorsRepository {
  constructor(private supabaseService: SupabaseService) {}
  private readonly logger = new Logger(CreatorsRepository.name);

  async findOneById(id: string) {
    const { data, error } = await this.supabaseService.client
      .from('creator_profiles')
      .select('*')
      .eq('id', id)
      .single();
    if (error) {
      this.logger.error(
        `Unable to find user by id: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'There was an internal server error finding user',
      );
    }
    return data;
  }

  async findOneByEmail(email: string) {
    const { data, error } = await this.supabaseService.client
      .from('creator_profiles')
      .select('*')
      .eq('email', email)
      .single();
    if (error) {
      this.logger.error(
        `Unable to find user by email: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'There was an internal server error finding user',
      );
    }
    return data;
  }

  async create(userData: CreatorProfileInterface) {
    const snakeCaseData = camelToSnake(userData);

    const { data, error } = await this.supabaseService.client
      .from('creator_profiles')
      .insert(snakeCaseData)
      .select()
      .single();
    if (error) {
      this.logger.error(`Unable to create user: ${error.message}`, error.stack);
      throw new InternalServerErrorException(
        'There was an internal server error adding user to creator_profiles table',
      );
    }
    return data;
  }

  async update(id: string, userData: Record<string, any>) {
    const snakeCaseData = camelToSnake(userData);
    const { data, error } = await this.supabaseService.client
      .from('creator_profiles')
      .update(snakeCaseData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      this.logger.error(
        `Unable to  update user: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'There was an internal server error updating user',
      );
    }
    return data;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabaseService.client
      .from('creator_profiles')
      .delete()
      .eq('id', id);

    if (error) {
      this.logger.error(`Unable to delete user: ${error.message}`, error.stack);
      throw new InternalServerErrorException(
        'There was an internal server error creating user',
      );
    }
  }
  async uploadedFile(
    file: Express.Multer.File,
    bucket: string,
    path: string,
  ): Promise<UploadFileResponse> {
    try {
      const publicUrl = await this.supabaseService.uploadFile(
        file,
        bucket,
        path,
      );
      return { url: publicUrl, path: path };
    } catch (error) {
      this.logger.error(
        `Unable to upload user profile picture: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'There was an internal server error creating user',
      );
    }
  }
  async deleteFile(bucket: string, path: string): Promise<void> {
    try {
      await this.supabaseService.deleteFile(bucket, path);
    } catch (error) {
      this.logger.error(`Unable to delete file: ${error.message}`, error.stack);
      throw new InternalServerErrorException(
        'There was an internal server error deleting file',
      );
    }
  }
}
