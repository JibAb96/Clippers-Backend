import { Test, TestingModule } from '@nestjs/testing';
import { ClippersService } from './clippers.service';
import { ClippersRepository } from './clippers.repository';
import { NotFoundException } from '@nestjs/common';
import { ClipperInterface } from '../interfaces/clipper-profile.interface';
import { Platform } from '../enums/platform.enum';
import { Niche } from '../enums/niche.enum';

jest.mock('camelcase-keys', () => ({
  __esModule: true,
  default: (obj: any) => obj, // Simple passthrough mock
}));

describe('ClippersService', () => {
  let service: ClippersService;
  let repository: ClippersRepository;

  const mockClipper: ClipperInterface = {
    id: '1',
    email: 'test@example.com',
    brandName: 'Test Clipper',
    brandProfilePicture: 'http://example.com/pic.jpg',
    fullName: 'Test Clipper',
    platform: Platform.YOUTUBE,
    niche: Niche.GAMING,
    socialMediaHandle: 'testing123',
    followerCount: 1000,
    pricePerPost: 10,
    country: 'Sweden',
  };

  const mockRepository = {
    findAll: jest.fn(),
    findOneById: jest.fn(),
    findOneByEmail: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    uploadedFile: jest.fn(),
    deleteFile: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClippersService,
        {
          provide: ClippersRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ClippersService>(ClippersService);
    repository = module.get<ClippersRepository>(ClippersRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of clippers', async () => {
      mockRepository.findAll.mockResolvedValue([mockClipper]);
      const result = await service.findAll();
      expect(result).toEqual([mockClipper]);
      expect(mockRepository.findAll).toHaveBeenCalled();
    });

    it('should return null when no clippers found', async () => {
      mockRepository.findAll.mockResolvedValue(null);
      const result = await service.findAll();
      expect(result).toBeNull();
    });
  });

  describe('findOneById', () => {
    it('should return a clipper by id', async () => {
      mockRepository.findOneById.mockResolvedValue(mockClipper);
      const result = await service.findOneById('1');
      expect(result).toEqual(mockClipper);
      expect(mockRepository.findOneById).toHaveBeenCalledWith('1');
    });

    it('should return null when id is not provided', async () => {
      const result = await service.findOneById('');
      expect(result).toBeNull();
      expect(mockRepository.findOneById).not.toHaveBeenCalled();
    });
  });

  describe('findOneByEmail', () => {
    it('should return a clipper by email', async () => {
      mockRepository.findOneByEmail.mockResolvedValue(mockClipper);
      const result = await service.findOneByEmail('test@example.com');
      expect(result).toEqual(mockClipper);
      expect(mockRepository.findOneByEmail).toHaveBeenCalledWith(
        'test@example.com',
      );
    });

    it('should return null when email is not provided', async () => {
      const result = await service.findOneByEmail('');
      expect(result).toBeNull();
      expect(mockRepository.findOneByEmail).not.toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should create a new clipper', async () => {
      mockRepository.create.mockResolvedValue(mockClipper);
      const result = await service.create(mockClipper);
      expect(result).toEqual(mockClipper);
      expect(mockRepository.create).toHaveBeenCalledWith(mockClipper);
    });
  });

  describe('update', () => {
    const updateData = { brandName: 'Updated Name' };

    it('should update a clipper', async () => {
      mockRepository.findOneById.mockResolvedValue(mockClipper);
      mockRepository.update.mockResolvedValue({
        ...mockClipper,
        ...updateData,
      });

      const result = await service.update('1', updateData);
      expect(result).toEqual({ ...mockClipper, ...updateData });
      expect(mockRepository.update).toHaveBeenCalledWith('1', updateData);
    });

    it('should throw NotFoundException when clipper not found', async () => {
      mockRepository.findOneById.mockResolvedValue(null);

      await expect(service.update('1', updateData)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete a clipper', async () => {
      mockRepository.findOneById.mockResolvedValue(mockClipper);
      mockRepository.delete.mockResolvedValue(undefined);

      await service.delete('1');
      expect(mockRepository.delete).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException when clipper not found', async () => {
      mockRepository.findOneById.mockResolvedValue(null);

      await expect(service.delete('1')).rejects.toThrow(NotFoundException);
      expect(mockRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe('uploadProfilePicture', () => {
    const mockFile = {
      fieldname: 'file',
      originalname: 'test.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      buffer: Buffer.from('test'),
      size: 1024,
    } as Express.Multer.File;

    it('should upload a profile picture', async () => {
      const mockResponse = { url: 'http://example.com/new-pic.jpg' };
      mockRepository.uploadedFile.mockResolvedValue(mockResponse);

      const result = await service.uploadProfilePicture(mockFile, '1');
      expect(result).toEqual(mockResponse);
      expect(mockRepository.uploadedFile).toHaveBeenCalledWith(
        mockFile,
        'clipper-profile-pictures',
        '1/profilepic',
      );
    });
  });

  describe('deleteImage', () => {
    it('should delete a profile picture', async () => {
      mockRepository.deleteFile.mockResolvedValue(undefined);

      const result = await service.deleteImage('1');
      expect(result).toEqual({
        success: true,
        message: 'Clipper image deleted successfully',
      });
      expect(mockRepository.deleteFile).toHaveBeenCalledWith(
        'clipper-profile-pictures',
        '1/profilepic',
      );
    });
  });
});
