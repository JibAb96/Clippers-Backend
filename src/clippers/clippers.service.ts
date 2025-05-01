import { Injectable, NotFoundException } from '@nestjs/common';
import { ClippersRepository } from "./clippers.repository"
import { ClipperInterface } from "../interfaces/clipper-profile.interface";
import camelCaseKeys from 'camelcase-keys';
import { UploadFileResponse } from "../interfaces/upload-response.interface";

@Injectable()
export class ClippersService {
  constructor(private readonly clippersRepository: ClippersRepository) {}
  async findAll(): Promise<ClipperInterface[] | null> {
  
    const userData = await this.clippersRepository.findAll();
    return userData
  }
  async findOneById(id: string): Promise<ClipperInterface | null> {
    if (!id) {
      return null;
    }
    const userData = await this.clippersRepository.findOneById(id);
    return camelCaseKeys(userData) as ClipperInterface;
  }

  async findOneByEmail(email: string): Promise<ClipperInterface | null> {
    if (!email) {
      return null;
    }
    const userData = await this.clippersRepository.findOneByEmail(email);
    return camelCaseKeys(userData) as ClipperInterface;
  }

  async create(user: ClipperInterface): Promise<ClipperInterface> {
    const userData = await this.clippersRepository.create(user);
    return camelCaseKeys(userData) as ClipperInterface;
  }

  async update(
    id: string,
    userData: Record<string, any>,
  ): Promise<ClipperInterface> {
    const findUser = await this.clippersRepository.findOneById(id);
    if (!findUser) {
      throw new NotFoundException('Creator not found');
    }
    const updatedUser = await this.clippersRepository.update(id, userData);
    return camelCaseKeys(updatedUser) as ClipperInterface;
  }

  async delete(id: string): Promise<void> {
    const findUser = await this.clippersRepository.findOneById(id);
    if (!findUser) {
      throw new NotFoundException('Creator not found');
    }
    await this.clippersRepository.delete(id);
  }

  async uploadProfilePicture(
      image: Express.Multer.File,
      clipperId: string,
    ): Promise<UploadFileResponse> {
      const file = await this.clippersRepository.uploadedFile(
        image,
        'clipper-profile-pictures',
        `${clipperId}/profilepic`,
      );
      return file;
  }
  async deleteImage(
    clipperID: string,
  ): Promise<{success: boolean, message: string}> {
     await this.clippersRepository.deleteFile(
      'clipper-profile-pictures',
      `${clipperID}/profilepic`,
    );
    return {
      success: true,
      message: 'Clipper image deleted successfully',
    }
  }
}
