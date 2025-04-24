import { Injectable, NotFoundException } from '@nestjs/common';

import { CreatorsRepository } from './creators.repository';
import { CreatorProfileInterface } from '../interfaces/creator-profle.interface';
import camelCaseKeys from 'camelcase-keys';
import { UploadFileResponse } from '../auth/interfaces/upload-response.interface';

@Injectable()
export class CreatorsService {
  constructor(private readonly creatorRepository: CreatorsRepository) {}
  async findOneById(id: string): Promise<CreatorProfileInterface | null> {
    if (!id) {
      return null;
    }
    const userData = await this.creatorRepository.findOneById(id);
    return camelCaseKeys(userData) as CreatorProfileInterface;
  }

  async findOneByEmail(email: string): Promise<CreatorProfileInterface | null> {
    if (!email) {
      return null;
    }
    const userData = await this.creatorRepository.findOneByEmail(email);
    return camelCaseKeys(userData) as CreatorProfileInterface;
  }

  async create(
    user: CreatorProfileInterface,
  ): Promise<CreatorProfileInterface> {
    const userData = await this.creatorRepository.create(user);
    return camelCaseKeys(userData) as CreatorProfileInterface;
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
    return camelCaseKeys(updatedUser) as CreatorProfileInterface;
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
    brandName: string,
  ): Promise<UploadFileResponse> {
    const sanitizedBrandName = brandName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const fileExtension = file.mimetype.split('/')[1];
    return await this.creatorRepository.uploadedFile(
      file,
      'brand-profile-pic',
      `${sanitizedBrandName}/profilepic.${fileExtension}`,
    );
  }
  async deleteImage(
    file: Express.Multer.File,
    brandName: string,
  ): Promise<void> {
    const sanitizedBrandName = brandName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_');
    const fileExtension = file.mimetype.split('/')[1];
    return await this.creatorRepository.deleteFile(
      'brand-profile-pic',
      `${sanitizedBrandName}/profilepic.${fileExtension}`,
    );
  }
}
