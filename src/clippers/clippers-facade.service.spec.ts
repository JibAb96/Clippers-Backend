import { Test, TestingModule } from '@nestjs/testing';
import { ClippersFacadeService } from './clippers-facade.service';
import { ClippersService } from './clippers.service';
import { PortfolioService } from './portforlio.service';
import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ClipperInterface } from '../interfaces/clipper-profile.interface';
import { Platform } from '../enums/platform.enum';
import { Niche } from '../enums/niche.enum';

describe('ClippersFacadeService', () => {
  let service: ClippersFacadeService;
  let clippersService: ClippersService;
  let portfolioService: PortfolioService;

  const mockClipper = {
    id: '1',
    email: 'test@example.com',
    brand_name: 'Test Clipper',
    brand_profile_picture: 'http://example.com/pic.jpg',
    full_name: 'Test Clipper',
    platform: Platform.YOUTUBE,
    niche: Niche.GAMING,
    social_media_handle: 'testing123',
    follower_count: 1000,
    price_per_post: 10,
    country: 'Sweden',
  };

  const mockPortfolioImage = {
    id: '1',
    clipperId: '1',
    imageUrl: 'http://example.com/portfolio.jpg',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockServices = {
    clippers: {
      findAll: jest.fn(),
      findOneById: jest.fn(),
      uploadProfilePicture: jest.fn(),
      update: jest.fn(),
      deleteImage: jest.fn(),
    },
    portfolio: {
      findAll: jest.fn(),
      hasReachedMaxImages: jest.fn(),
      uploadPortfolioPicture: jest.fn(),
      create: jest.fn(),
      deletePortfolioPicture: jest.fn(),
      delete: jest.fn(),
    },
    guidelines: {
      findAllByClipperId: jest.fn(),
      create: jest.fn(),
      findOneById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClippersFacadeService,
        {
          provide: ClippersService,
          useValue: mockServices.clippers,
        },
        {
          provide: PortfolioService,
          useValue: mockServices.portfolio,
        },
      
      ],
    }).compile();

    service = module.get<ClippersFacadeService>(ClippersFacadeService);
    clippersService = module.get<ClippersService>(ClippersService);
    portfolioService = module.get<PortfolioService>(PortfolioService);

  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getClippers', () => {
    it('should return all clippers', async () => {
      mockServices.clippers.findAll.mockResolvedValue([mockClipper]);
      const result = await service.getClippers();
      expect(result).toEqual([mockClipper]);
    });
  });

  describe('getClipperById', () => {
    it('should return a clipper by id', async () => {
      mockServices.clippers.findOneById.mockResolvedValue(mockClipper);
      const result = await service.getClipperById('1');
      expect(result).toEqual(mockClipper);
    });
  });

  describe('uploadClipperImage', () => {
    const mockFile = {
      fieldname: 'file',
      originalname: 'test.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      buffer: Buffer.from('test'),
      size: 1024,
    } as Express.Multer.File;

    it('should upload clipper image and update profile', async () => {
      const uploadResponse = { url: 'http://example.com/new-pic.jpg' };
      mockServices.clippers.uploadProfilePicture.mockResolvedValue(
        uploadResponse,
      );
      mockServices.clippers.update.mockResolvedValue({
        ...mockClipper,
        brandProfilePicture: uploadResponse.url,
      });

      const result = await service.uploadClipperImage(mockFile, '1');
      expect(result.brandProfilePicture).toBe(uploadResponse.url);
    });
  });

  describe('deleteClipperImage', () => {
    it('should delete clipper image successfully', async () => {
      mockServices.clippers.findOneById.mockResolvedValue(mockClipper);
      mockServices.clippers.update.mockResolvedValue({
        ...mockClipper,
        brandProfilePicture: null,
      });
      mockServices.clippers.deleteImage.mockResolvedValue({
        success: true,
        message: 'Deleted',
      });

      const result = await service.deleteClipperImage('1');
      expect(result.success).toBe(true);
    });

    it('should handle bucket deletion error and rollback', async () => {
      mockServices.clippers.findOneById.mockResolvedValue(mockClipper);
      mockServices.clippers.update.mockResolvedValueOnce({
        ...mockClipper,
        brandProfilePicture: null,
      });
      mockServices.clippers.deleteImage.mockRejectedValue(
        new Error('Bucket error'),
      );

      await expect(service.deleteClipperImage('1')).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('Portfolio Operations', () => {
    describe('getPortfolioImages', () => {
      it('should return portfolio images', async () => {
        mockServices.portfolio.findAll.mockResolvedValue([mockPortfolioImage]);
        const result = await service.getPortfolioImages('1');
        expect(result).toEqual([mockPortfolioImage]);
      });
    });

    describe('uploadPortfolioImage', () => {
      const mockFiles = [
        {
          fieldname: 'file',
          originalname: 'portfolio.jpg',
          encoding: '7bit',
          mimetype: 'image/jpeg',
          buffer: Buffer.from('test'),
          size: 1024,
        },
      ] as Express.Multer.File[];

      it('should upload portfolio images successfully', async () => {
        mockServices.portfolio.hasReachedMaxImages.mockResolvedValue(false);
        mockServices.portfolio.uploadPortfolioPicture.mockResolvedValue({
          url: 'http://example.com/portfolio.jpg',
        });
        mockServices.portfolio.create.mockResolvedValue(mockPortfolioImage);

        const result = await service.uploadPortfolioImage(mockFiles, '1');
        expect(result).toHaveLength(1);
        expect(result[0]).toEqual(mockPortfolioImage);
      });

      it('should throw BadRequestException when max images reached', async () => {
        mockServices.portfolio.hasReachedMaxImages.mockResolvedValue(true);
        await expect(
          service.uploadPortfolioImage(mockFiles, '1'),
        ).rejects.toThrow(BadRequestException);
      });
    });

    describe('deletePortfolioImage', () => {
      it('should delete portfolio image successfully', async () => {
        mockServices.portfolio.deletePortfolioPicture.mockResolvedValue(
          undefined,
        );
        mockServices.portfolio.delete.mockResolvedValue(undefined);

        await service.deletePortfolioImage('1', '1');
        expect(
          mockServices.portfolio.deletePortfolioPicture,
        ).toHaveBeenCalled();
        expect(mockServices.portfolio.delete).toHaveBeenCalled();
      });

      it('should handle errors during deletion', async () => {
        mockServices.portfolio.deletePortfolioPicture.mockRejectedValue(
          new Error('Delete error'),
        );
        await expect(service.deletePortfolioImage('1', '1')).rejects.toThrow(
          InternalServerErrorException,
        );
      });
    });
  });
});
