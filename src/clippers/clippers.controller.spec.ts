import { Test, TestingModule } from '@nestjs/testing';
import { ClippersController } from './clippers.controller';
import { ClippersFacadeService } from './clippers-facade.service';
import { ClipperInterface } from '../interfaces/clipper-profile.interface';
import { PortfolioResponse } from './interfaces/portfolio-response.interface';
import { SupabaseUser } from '../interfaces/auth-request.interface';
import { Niche } from '../enums/niche.enum';
import { Platform } from '../enums/platform.enum';
import { ExecutionContext } from '@nestjs/common';

jest.mock('../guards/supabase-auth.guard', () => ({
  SupabaseAuthGuard: jest.fn().mockImplementation(() => ({
    canActivate: (context: ExecutionContext) => true,
  })),
}));

describe('ClippersController', () => {
  let controller: ClippersController;
  let facadeService: ClippersFacadeService;

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

  const mockPortfolioImage: PortfolioResponse = {
    id: '1',
    imageUrl: 'http://example.com/portfolio.jpg',
  };

  const mockCurrentUser: SupabaseUser = {
    id: '1',
    email: 'test@example.com',
    role: 'clipper',
  };

  const mockFacadeService = {
    getClippers: jest.fn(),
    getClipperById: jest.fn(),
    uploadClipperImage: jest.fn(),
    deleteClipperImage: jest.fn(),
    getPortfolioImages: jest.fn(),
    uploadPortfolioImage: jest.fn(),
    deletePortfolioImage: jest.fn(),
    getGuidelines: jest.fn(),
    createGuidelines: jest.fn(),
    updateGuidelines: jest.fn(),
    deleteGuidelines: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClippersController],
      providers: [
        {
          provide: ClippersFacadeService,
          useValue: mockFacadeService,
        },
      ],
    }).compile();

    controller = module.get<ClippersController>(ClippersController);
    facadeService = module.get<ClippersFacadeService>(ClippersFacadeService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getClippers', () => {
    it('should return all clippers', async () => {
      mockFacadeService.getClippers.mockResolvedValue([mockClipper]);

      const result = await controller.getClippers();
      expect(result).toEqual({
        status: 'success',
        data: [mockClipper],
        message: 'Clippers fetched successfully',
      });
    });
  });

  describe('getClipperById', () => {
    it('should return a clipper by id', async () => {
      mockFacadeService.getClipperById.mockResolvedValue(mockClipper);

      const result = await controller.getClipperById('1');
      expect(result).toEqual({
        status: 'success',
        data: mockClipper,
        message: 'Clipper fetched successfully',
      });
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

    it('should upload clipper image', async () => {
      mockFacadeService.uploadClipperImage.mockResolvedValue(mockClipper);

      const result = await controller.uploadClipperImage(
        mockFile,
        mockCurrentUser,
      );
      expect(result).toEqual({
        status: 'success',
        data: mockClipper,
        message: 'Clipper image uploaded successfully',
      });
      expect(mockFacadeService.uploadClipperImage).toHaveBeenCalledWith(
        mockFile,
        mockCurrentUser.id,
      );
    });
  });

  describe('deleteClipperImage', () => {
    it('should delete clipper image', async () => {
      const deleteResponse = {
        success: true,
        message: 'Image deleted successfully',
      };
      mockFacadeService.deleteClipperImage.mockResolvedValue(deleteResponse);

      const result = await controller.deleteClipperImage(mockCurrentUser);
      expect(result).toEqual({
        status: 'success',
        data: deleteResponse,
        message: deleteResponse.message,
      });
      expect(mockFacadeService.deleteClipperImage).toHaveBeenCalledWith(
        mockCurrentUser.id,
      );
    });
  });

  describe('Portfolio Operations', () => {
    describe('getPortfolioImages', () => {
      it('should return portfolio images', async () => {
        mockFacadeService.getPortfolioImages.mockResolvedValue([
          mockPortfolioImage,
        ]);

        const result = await controller.getPortfolioImages('1');
        expect(result).toEqual({
          status: 'success',
          data: [mockPortfolioImage],
          message: 'Portfolio images retrieved successfully',
        });
      });
    });

    describe('uploadPortfolioImages', () => {
      const mockFiles = [
        {
          fieldname: 'file',
          originalname: 'test.jpg',
          encoding: '7bit',
          mimetype: 'image/jpeg',
          buffer: Buffer.from('test'),
          size: 1024,
        },
      ] as Express.Multer.File[];

      it('should upload portfolio images', async () => {
        mockFacadeService.uploadPortfolioImage.mockResolvedValue([
          mockPortfolioImage,
        ]);

        const result = await controller.uploadPortfolioImages(
          mockFiles,
          mockCurrentUser,
        );
        expect(result).toEqual({
          status: 'success',
          data: [mockPortfolioImage],
          message: 'Portfolio images successfully uploaded',
        });
      });

      it('should handle no images uploaded', async () => {
        const result = await controller.uploadPortfolioImages(
          [],
          mockCurrentUser,
        );
        expect(result).toEqual({
          status: 'error',
          data: [],
          message: 'No images uploaded',
        });
      });

      it('should handle too many images', async () => {
        const tooManyFiles = [
          ...mockFiles,
          ...mockFiles,
          ...mockFiles,
          ...mockFiles,
          ...mockFiles,
        ];
        const result = await controller.uploadPortfolioImages(
          tooManyFiles,
          mockCurrentUser,
        );
        expect(result).toEqual({
          status: 'error',
          data: [],
          message: 'You can upload a maximum of 4 images',
        });
      });
    });

    describe('deletePortfolioImage', () => {
      it('should delete portfolio image', async () => {
        mockFacadeService.deletePortfolioImage.mockResolvedValue(undefined);

        const result = await controller.deletePortfolioImage(
          mockCurrentUser,
          '1',
        );
        expect(result).toEqual({
          status: 'success',
          data: undefined,
          message: 'Portfolio image deleted successfully',
        });
      });
    });
  });
});
