import { Test, TestingModule } from '@nestjs/testing';
import { UserFacadeService } from './user-facade.service';
import { AuthService } from './auth.service';
import { CreatorsService } from '../creators/creators.service';
import { ClippersService } from '../clippers/clippers.service';
import {
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { RegisterCreatorDto } from './dtos/creators/register-creator.dto';
import { RegisterClipperDto } from './dtos/clippers/register-clipper.dto';
import { Platform } from "../enums/platform.enum";
import { Niche } from "../enums/niche.enum";

describe('UserFacadeService', () => {
  let service: UserFacadeService;
  let mockAuthService: Partial<AuthService>;
  let mockCreatorsService: Partial<CreatorsService>;
  let mockClippersService: Partial<ClippersService>;

  beforeEach(async () => {
    mockAuthService = {
      register: jest.fn(),
      deleteUser: jest.fn(),
      changePassword: jest.fn(),
    };
    mockCreatorsService = {
      create: jest.fn(),
      findOneById: jest.fn(),
      update: jest.fn(),
      uploadProfilePicture: jest.fn(),
      deleteImage: jest.fn(),
    };
    mockClippersService = {
      create: jest.fn(),
      findOneById: jest.fn(),
      update: jest.fn(),
      uploadProfilePicture: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserFacadeService,
        { provide: AuthService, useValue: mockAuthService },
        { provide: CreatorsService, useValue: mockCreatorsService },
        { provide: ClippersService, useValue: mockClippersService },
      ],
    }).compile();

    service = module.get<UserFacadeService>(UserFacadeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('registerCreator', () => {
    it('should register a creator and return user response', async () => {
      const form = {
        email: 'test@email.com',
        password: 'pass',
        fullName: 'Test',
        brandName: 'Brand',
        socialMediaHandle: '@test',
        platform: Platform.YOUTUBE,
        niche: Niche.TECHNOLOGY,
        country: 'US',
      } as RegisterCreatorDto;
      const authData = { id: '1', token: 'token', refreshToken: 'refresh' };
      const userProfile = { id: '1', fullName: 'Test' };
      (mockAuthService.register as jest.Mock).mockResolvedValue(authData);
      (mockCreatorsService.create as jest.Mock).mockResolvedValue(userProfile);
      const result = await service.registerCreator(form);
      expect(result).toEqual({
        user: userProfile,
        role: 'creator',
        token: 'token',
        refreshToken: 'refresh',
      });
    });

    it('should rollback and throw if profile creation fails', async () => {
      const form = {
        email: 'test@email.com',
        password: 'pass',
        fullName: 'Test',
        brandName: 'Brand',
        socialMediaHandle: '@test',
        platform: Platform.YOUTUBE,
        niche: Niche.TECHNOLOGY,
        country: 'US',
      } as RegisterCreatorDto;
      const authData = { id: '1', token: 'token', refreshToken: 'refresh' };
      (mockAuthService.register as jest.Mock).mockResolvedValue(authData);
      (mockCreatorsService.create as jest.Mock).mockRejectedValue(
        new Error('fail'),
      );
      (mockAuthService.deleteUser as jest.Mock).mockResolvedValue(undefined);
      await expect(service.registerCreator(form)).rejects.toThrow(
        InternalServerErrorException,
      );
      expect(mockAuthService.deleteUser).toHaveBeenCalledWith('1');
    });
  });

  describe('registerClipper', () => {
    it('should register a clipper and return user response', async () => {
      const form = {
        email: 'test@email.com',
        password: 'pass',
        fullName: 'Test',
        brandName: 'Brand',
        socialMediaHandle: '@test',
        platform: Platform.YOUTUBE,
        niche: Niche.TECHNOLOGY,
        country: 'US',
        followerCount: 1,
        pricePerPost: 1,
      } as RegisterClipperDto;
      const authData = { id: '2', token: 'token', refreshToken: 'refresh' };
      const clipperProfile = { id: '2', fullName: 'Test' };
      (mockAuthService.register as jest.Mock).mockResolvedValue(authData);
      (mockClippersService.create as jest.Mock).mockResolvedValue(
        clipperProfile,
      );
      const result = await service.registerClipper(form);
      expect(result).toEqual({
        user: clipperProfile,
        role: 'clipper',
        token: 'token',
        refreshToken: 'refresh',
      });
    });

    it('should rollback and throw if profile creation fails', async () => {
      const form = {
        email: 'test@email.com',
        password: 'pass',
        fullName: 'Test',
        brandName: 'Brand',
        socialMediaHandle: '@test',
        platform: Platform.YOUTUBE,
        niche: Niche.TECHNOLOGY,
        country: 'US',
        followerCount: 1,
        pricePerPost: 1,
      } as RegisterClipperDto;
      const authData = { id: '2', token: 'token', refreshToken: 'refresh' };
      (mockAuthService.register as jest.Mock).mockResolvedValue(authData);
      (mockClippersService.create as jest.Mock).mockRejectedValue(
        new Error('fail'),
      );
      (mockAuthService.deleteUser as jest.Mock).mockResolvedValue(undefined);
      await expect(service.registerClipper(form)).rejects.toThrow(
        InternalServerErrorException,
      );
      expect(mockAuthService.deleteUser).toHaveBeenCalledWith('2');
    });
  });

  describe('uploadCreatorImage', () => {
    it('should upload image and update profile', async () => {
      const image = {} as Express.Multer.File;
      const userId = '1';
      (mockCreatorsService.findOneById as jest.Mock).mockResolvedValue({
        id: userId,
      });
      (mockCreatorsService.uploadProfilePicture as jest.Mock).mockResolvedValue(
        'url',
      );
      (mockCreatorsService.update as jest.Mock).mockResolvedValue({});
      const result = await service.uploadCreatorImage(image, userId);
      expect(result).toBe('image uploaded successfully');
      expect(mockCreatorsService.uploadProfilePicture).toHaveBeenCalledWith(
        image,
        userId,
      );
      expect(mockCreatorsService.update).toHaveBeenCalledWith(userId, {
        brandProfilePicture: 'url',
      });
    });

    it('should throw NotFoundException if creator not found', async () => {
      (mockCreatorsService.findOneById as jest.Mock).mockResolvedValue(null);
      await expect(
        service.uploadCreatorImage({} as Express.Multer.File, '1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      (mockAuthService.changePassword as jest.Mock).mockResolvedValue(
        undefined,
      );
      const result = await service.changePassword('newpass');
      expect(result).toEqual({
        success: true,
        message: 'Password changed successfully',
      });
      expect(mockAuthService.changePassword).toHaveBeenCalledWith('newpass');
    });

    it('should propagate errors from authService', async () => {
      (mockAuthService.changePassword as jest.Mock).mockRejectedValue(
        new Error('fail'),
      );
      await expect(service.changePassword('failpass')).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});
