import { Test, TestingModule } from '@nestjs/testing';
import { CreatorsService } from './creators.service';
import { CreatorsRepository } from './creators.repository';

describe('CreatorsService', () => {
  let service: CreatorsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CreatorsService],
    }).compile();

    service = module.get<CreatorsService>(CreatorsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
describe('CreatorsService', () => {
  let service: CreatorsService;
  let repository: jest.Mocked<CreatorsRepository>;

  const mockFile = {
    fieldname: 'file',
    originalname: 'test.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    buffer: Buffer.from('test'),
    size: 4,
  } as Express.Multer.File;

  beforeEach(async () => {
    const mockRepository = {
      deleteFile: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreatorsService,
        {
          provide: CreatorsRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<CreatorsService>(CreatorsService);
    repository = module.get(CreatorsRepository);
  });

  describe('deleteImage', () => {
    it('should delete image with sanitized brand name', async () => {
      const brandName = 'Test Brand!';
      await service.deleteImage(mockFile, brandName);

      expect(repository.deleteFile).toHaveBeenCalledWith(
        'brand-profile-pic',
        'test_brand/profilepic.jpeg'
      );
    });

    it('should handle special characters in brand name', async () => {
      const brandName = 'Test@Brand#123';
      await service.deleteImage(mockFile, brandName);

      expect(repository.deleteFile).toHaveBeenCalledWith(
        'brand-profile-pic',
        'test_brand_123/profilepic.jpeg'
      );
    });

    it('should handle different file types', async () => {
      const pngFile = { ...mockFile, mimetype: 'image/png' };
      await service.deleteImage(pngFile, 'Test Brand');

      expect(repository.deleteFile).toHaveBeenCalledWith(
        'brand-profile-pic',
        'test_brand/profilepic.png'
      );
    });
  });
});
