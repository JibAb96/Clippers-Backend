import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ClippersService } from './clippers.service';
import { PortfolioService } from './portforlio.service';
import { GuidelinesService } from './guidelines.service';
import { GuidelinesInterface } from './interfaces/guidlines.interface';
import { PortfolioResponse } from './interfaces/portfolio-response.interface';
import { v4 as uuidv4 } from 'uuid';
import { ClipperInterface } from '../interfaces/clipper-profile.interface';

@Injectable()
export class ClippersFacadeService {
  private readonly logger = new Logger(ClippersFacadeService.name);

  constructor(
    private readonly clippersService: ClippersService,
    private readonly portfolioService: PortfolioService,
    private readonly guidelinesService: GuidelinesService,
  ) {}

  // Clippers
  async getClippers() {
    return this.clippersService.findAll();
  }

  async getClipperById(clipperId: string) {
    return this.clippersService.findOneById(clipperId);
  }

  async uploadClipperImage(
    image: Express.Multer.File,
    clipperId: string,
  ): Promise<ClipperInterface> {
    const response = await this.clippersService.uploadProfilePicture(
      image,
      clipperId,
    );
    return await this.clippersService.update(clipperId, {
      brandProfilePicture: response.url,
    });
  }

  async deleteClipperImage(
    clipperId: string,
  ): Promise<{ success: boolean; message: string }> {
    // Get the current profile to restore if needed
    const profile = await this.clippersService.findOneById(clipperId);
    const previousProfilePic = profile?.brandProfilePicture ?? null;
    let message: string = '';

    try {
      // Set the brandProfilePic column to null
      await this.clippersService.update(clipperId, { brandProfilePic: null });

      try {
        // Delete the image from the bucket
        const response = await this.clippersService.deleteImage(clipperId);
        message = response.message;
      } catch (bucketError) {
        // Rollback the DB update if bucket deletion fails
        await this.clippersService.update(clipperId, {
          brandProfilePic: previousProfilePic,
        });
        throw new InternalServerErrorException(
          'There was an internal server error deleting the profile image from storage. Changes have been rolled back.',
        );
      }

      return {
        success: true,
        message: message,
      };
    } catch (error) {
      this.logger.error(
        `Error deleting clipper image: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'There was an internal server error deleting the profile image',
      );
    }
  }

  // Portfolio

  async getPortfolioImages(userId: string) {
    return this.portfolioService.findAll(userId);
  }

  async uploadPortfolioImage(images: Express.Multer.File[], clipperId: string) {
    
    const results: PortfolioResponse[] = [];

    for (const image of images) {
      // 1. Upload image to storage and get URL
      const hasReachedMaxImages =
        await this.portfolioService.hasReachedMaxImages(clipperId);
      if (hasReachedMaxImages) {
        throw new BadRequestException(
          'You have reached the maximum number of portfolio images',
        );
      }
      const id = this.generateUUID();
      const uploadResult = await this.portfolioService.uploadPortfolioPicture(
        image,
        clipperId,
        id,
      );
      // 2. Add record to portfolio table
      const portfolioRecord = await this.portfolioService.create({
        id,
        clipperId,
        imageUrl: uploadResult.url,
      });
      results.push(portfolioRecord);
    }
    return results as PortfolioResponse[];
  }

  async deletePortfolioImage(clipperId: string, id: string): Promise<void> {
    try {
      await this.portfolioService.deletePortfolioPicture(clipperId, id);
      try {
        await this.portfolioService.delete(id);
      } catch (error) {
        this.logger.error(`Error deleting portfolio image: ${error.message}`, error.stack);
        throw new InternalServerErrorException('There was an internal server error deleting the portfolio row from the database');
      }
    } catch (error) {
      this.logger.error(`Error deleting portfolio image: ${error.message}`, error.stack);
      throw new InternalServerErrorException('There was an internal server error deleting the portfolio image');
    }
  }

  // Guidelines
  async getGuidelines(userId: string) {
    return this.guidelinesService.findAllByClipperId(userId);
  }

  async createGuidelines(body: GuidelinesInterface) {
    return this.guidelinesService.create(body);
  }

  async updateGuidelines(id: string, body: GuidelinesInterface) {
    const findGuideline = await this.guidelinesService.findOneById(id);
    if (!findGuideline) {
      throw new NotFoundException('Guideline not found');
    }
    return this.guidelinesService.update(id, body);
  }

  async deleteGuidelines(id: string) {
    return this.guidelinesService.delete(id);
  }

  private generateUUID() {
    return uuidv4();
  }
}
