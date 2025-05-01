import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { PortfolioInterface } from './interfaces/portfolio.interface';
import { camelToSnake } from 'src/utility/camelToSnake';
import { PortfolioResponse } from './interfaces/portfolio-response.interface';
import { UploadFileResponse } from "src/interfaces/upload-response.interface";
@Injectable()
export class PortfolioRepository {
  constructor(private supabaseService: SupabaseService) {}
  private readonly logger = new Logger(PortfolioRepository.name);

  async findOneById(id: string): Promise<PortfolioResponse> {
    const { data, error } = await this.supabaseService.client
      .from('portfolio_images')
      .select('*')
      .eq('id', id)
      .single();
    if (error) {
      this.logger.error(
        `Unable to find image by id: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'There was an internal server error finding portfolio image',
      );
    }
    return {
      imageUrl: data.image_url,
      id: data.id,
    };
  }

  async findAllByClipperId(id: string): Promise<PortfolioResponse[]> {
    const { data, error } = await this.supabaseService.client
      .from('portfolio_images')
      .select('*')
      .eq('clipper_id', id)
      .order('position', { ascending: true });

    if (error) {
      this.logger.error(
        `Unable to find portfolio images for clipper id ${id}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'There was an internal server error retrieving portfolio images',
      );
    }

    if (!data || data.length === 0) {
      return [];
    }

    return data.map((item) => ({
      imageUrl: item.image_url,
      position: item.position,
      id: item.id,
    }));
  }

  async create(portfolioData: PortfolioInterface): Promise<PortfolioResponse> {
    const snakeCaseData = camelToSnake(portfolioData);

    const { data, error } = await this.supabaseService.client
      .from('portfolio_images')
      .insert(snakeCaseData)
      .select()
      .single();
    if (error) {
      this.logger.error(`Unable to create user: ${error.message}`, error.stack);
      throw new InternalServerErrorException(
        'There was an internal server error creating user',
      );
    }
    return {
      imageUrl: data.image_url,
      id: data.id,
    };
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabaseService.client
      .from('portfolio_images')
      .delete()
      .eq('id', id);

    if (error) {
      this.logger.error(`Unable to delete portfolio image: ${error.message}`, error.stack);
      throw new InternalServerErrorException(
        'There was an internal server error deleting portfolio image',
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
        `Unable to upload portfolio picture: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'There was an internal server error uploading portfolio picture',
      );
    }
  }

  async deleteFile(bucket: string, path: string): Promise<void> {
    try {
      await this.supabaseService.deleteFile(bucket, path);
    } catch (error) {
      this.logger.error(`Unable to delet portfolio image: ${error.message}`, error.stack);
      throw new InternalServerErrorException(
        'There was an internal server error deleting portfolio image',
      );
    }
  }

  async hasReachedMaxImages(clipperId, maxImages = 4) {
  try {
    // Count the number of images for this clipper_id
    const { count, error } = await this.supabaseService
      .client
      .from('portfolio_images')
      .select('*', { count: 'exact', head: true })
      .eq('clipper_id', clipperId);
      
    if (error) {
      console.error('Error checking portfolio count:', error);
      throw error;
    }
    
    // Return true if count has reached or exceeded maxImages
    if(count === null) {
      return false;
    }
    return count >= maxImages;
  } catch (err) {
    console.error('Failed to check portfolio count:', err);
    throw err;
  }
}
}
