import { Injectable, NotFoundException } from '@nestjs/common';
import { PortfolioRepository } from './portfolio.repository';
import { PortfolioResponse } from './interfaces/portfolio-response.interface';
import { PortfolioInterface } from './interfaces/portfolio.interface';
import { UploadFileResponse } from 'src/interfaces/upload-response.interface';

@Injectable()
export class PortfolioService {
  constructor(private readonly portfolioRepository: PortfolioRepository) {}

  async findAll(id: string): Promise<PortfolioResponse[]> {
    const userData = await this.portfolioRepository.findAllByClipperId(id);
    return userData as PortfolioResponse[];
  }

  async findOneById(id: string): Promise<PortfolioResponse | null> {
    if (!id) {
      return null;
    }
    const userData = await this.portfolioRepository.findOneById(id);
    return userData as PortfolioResponse;
  }

  async create(user: PortfolioInterface): Promise<PortfolioResponse> {
    const userData = await this.portfolioRepository.create(user);
    return userData as PortfolioResponse;
  }

  async delete(id: string): Promise<void> {
    const findPorfolioImage = await this.portfolioRepository.findOneById(id);
    if (!findPorfolioImage) {
      throw new NotFoundException('Portfolio image not found');
    }
    await this.portfolioRepository.delete(id);
  }

  async uploadPortfolioPicture(
    file: Express.Multer.File,
    clipperId: string,
    id: string
  ): Promise<UploadFileResponse> {
    const path = `${clipperId}/${id}`;
    return await this.portfolioRepository.uploadedFile(
      file,
      'portfolio-images',
      path,
    );
  }

  async deletePortfolioPicture(
    clipperId: string,
    id: string
  ): Promise<void> {

    const fileName = `${clipperId}/${id}`;

    return await this.portfolioRepository.deleteFile(
      'portfolio-images',
      fileName,
    );
  }

  async hasReachedMaxImages(clipperId: string): Promise<boolean> {
    return await this.portfolioRepository.hasReachedMaxImages(clipperId);
  }
}
