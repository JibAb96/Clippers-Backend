import { Injectable, NotFoundException } from '@nestjs/common';

import { CreatorsRepository } from './creators.repository';
import { CreatorProfileInterface } from '../interfaces/creator-profle.interface';
import { snakeToCamel } from '../utility/camelToSnake';
import { UploadFileResponse } from '../interfaces/upload-response.interface';

@Injectable()
export class CreatorsService {
  constructor(private readonly creatorRepository: CreatorsRepository) { }
  
  async findOneById(id: string): Promise<CreatorProfileInterface | null> {
    if (!id) {
      return null;
    }
    const userData = await this.creatorRepository.findOneById(id);
    return snakeToCamel(userData) as CreatorProfileInterface;
  }

  async findOneByEmail(email: string): Promise<CreatorProfileInterface | null> {
    if (!email) {
      return null;
    }
    const userData = await this.creatorRepository.findOneByEmail(email);
    return snakeToCamel(userData) as CreatorProfileInterface;
  }

  async create(
    user: CreatorProfileInterface,
  ): Promise<CreatorProfileInterface> {
    const userData = await this.creatorRepository.create(user);
    return snakeToCamel(userData) as CreatorProfileInterface;
  }

  async update(
    id: string,
    userData: Record<string, any>,
  ): Promise<CreatorProfileInterface> {
    const findUser = await this.creatorRepository.findOneById(id);
    if (!findUser) {
      throw new NotFoundException('Creator not found');
    }
    const updatedUser = await this.creatorRepository.update(id, userData);
    return snakeToCamel(updatedUser) as CreatorProfileInterface;
  }

  async delete(id: string): Promise<void> {
    const findUser = await this.creatorRepository.findOneById(id);
    if (!findUser) {
      throw new NotFoundException('Creator not found');
    }
    await this.creatorRepository.delete(id);
  }

  async uploadProfilePicture(
    file: Express.Multer.File,
    userId: string,
  ): Promise<string> {
    const response = await this.creatorRepository.uploadedFile(
      file,
      'creator-profile-pictures',
      `${userId}/profilepic`,
    );
    return response.url;
  }
  async deleteImage(
    clipperId: string,
  ): Promise<void> {
    return await this.creatorRepository.deleteFile(
      'creator-profile-pictures',
      `${clipperId}/profilepic`,
    );
  }
}
