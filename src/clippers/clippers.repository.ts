import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { camelToSnake } from '../utility/camelToSnake';
import { ClipperInterface } from "src/interfaces/clipper-profile.interface";
import { UploadFileResponse } from "src/interfaces/upload-response.interface";
@Injectable()
export class ClippersRepository {
  constructor(private supabaseService: SupabaseService) {}
  private readonly logger = new Logger(ClippersRepository.name);

  async findAll(): Promise<ClipperInterface[]> {
    const { data, error } = await this.supabaseService.client
      .from('clippers')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      this.logger.error(
        `Unable to get clippers: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'There was an internal server error getting clippers',
      );
    }
    return data.map((clipper) => camelToSnake(clipper)) as ClipperInterface[];
  }

  async findOneById(id: string) {
    const { data, error } = await this.supabaseService.client
      .from('clippers')
      .select('*')
      .eq('id', id)
      .single();
    if (error) {
      this.logger.error(
        `Unable to find clipper by id: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'There was an internal server error finding clipper',
      );
    }
    return data;
  }

  async findOneByEmail(email: string) {
    const { data, error } = await this.supabaseService.client
      .from('clippers')
      .select('*')
      .eq('email', email)
      .single();
    if (error) {
      this.logger.error(
        `Unable to find clipper by email: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'There was an internal server error finding clipper by email',
      );
    }
    return data;
  }

  async create(clipperData: ClipperInterface) {
    const snakeCaseData = camelToSnake(clipperData);

    const { data, error } = await this.supabaseService.client
      .from('clippers')
      .insert(snakeCaseData)
      .select()
      .single();
    if (error) {
      this.logger.error(
        `Unable to create clipper: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'There was an internal server error creating clipper',
      );
    }
    return data;
  }

  async update(id: string, clipperData: Record<string, any>) {
    const snakeCaseData = camelToSnake(clipperData);
    const { data, error } = await this.supabaseService.client
      .from('clippers')
      .update(snakeCaseData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      this.logger.error(
        `Unable to update clipper data: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'There was an internal server error updating clipper data',
      );
    }
    return data;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabaseService.client
      .from('clippers')
      .delete()
      .eq('id', id);

    if (error) {
      this.logger.error(
        `Unable to delete clipper: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'There was an internal server error deleting clipper',
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
          `Unable to upload clipper profile picture: ${error.message}`,
          error.stack,
        );
        throw new InternalServerErrorException(
          'There was an internal server error uploading file',
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
