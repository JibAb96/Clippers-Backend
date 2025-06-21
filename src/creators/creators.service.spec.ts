import { Test, TestingModule } from '@nestjs/testing';
import { CreatorsService } from './creators.service';
import { CreatorsRepository } from './creators.repository';
import { NotFoundException } from '@nestjs/common';
import { CreatorProfileInterface } from '../interfaces/creator-profle.interface';


jest.mock('camelcase-keys', () => ({
  __esModule: true,
  default: (obj: any) => obj, // Simple passthrough mock
}));

describe('CreatorsService', () => {
  let service: CreatorsService;
  let repository: jest.Mocked<CreatorsRepository>;

  const mockUser: CreatorProfileInterface = {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    // add other required fields as needed
  } as any;

  const mockFile = {
    fieldname: 'file',
    originalname: 'test.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    buffer: Buffer.from('test'),
    size: 4,
  } as Express.Multer.File;

  beforeEach(async () => {
    repository = {
      findOneById: jest.fn(),
      findOneByEmail: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      uploadedFile: jest.fn(),
      deleteFile: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreatorsService,
        { provide: CreatorsRepository, useValue: repository },
      ],
    }).compile();

    service = module.get<CreatorsService>(CreatorsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOneById', () => {
    it('should return null if no id', async () => {
      expect(await service.findOneById('')).toBeNull();
    });
    it('should return user if found', async () => {
      repository.findOneById.mockResolvedValue(mockUser);
      const result = await service.findOneById('1');
      expect(result).toEqual(mockUser);
    });
    it('should throw if repository throws', async () => {
      repository.findOneById.mockRejectedValue(new Error('fail'));
      await expect(service.findOneById('1')).rejects.toThrow('fail');
    });
  });

  describe('findOneByEmail', () => {
    it('should return null if no email', async () => {
      expect(await service.findOneByEmail('')).toBeNull();
    });
    it('should return user if found', async () => {
      repository.findOneByEmail.mockResolvedValue(mockUser);
      const result = await service.findOneByEmail('test@example.com');
      expect(result).toEqual(mockUser);
    });
    it('should throw if repository throws', async () => {
      repository.findOneByEmail.mockRejectedValue(new Error('fail'));
      await expect(service.findOneByEmail('test@example.com')).rejects.toThrow(
        'fail',
      );
    });
  });

  describe('create', () => {
    it('should create and return user', async () => {
      repository.create.mockResolvedValue(mockUser);
      const result = await service.create(mockUser);
      expect(repository.create).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(mockUser);
    });
    it('should throw if repository throws', async () => {
      repository.create.mockRejectedValue(new Error('fail'));
      await expect(service.create(mockUser)).rejects.toThrow('fail');
    });
  });

  describe('update', () => {
    it('should update and return user if found', async () => {
      repository.findOneById.mockResolvedValue(mockUser);
      repository.update.mockResolvedValue({ ...mockUser, name: 'Updated' });
      const result = await service.update('1', { name: 'Updated' });
      expect(repository.update).toHaveBeenCalledWith('1', { name: 'Updated' });
      expect(result).toEqual({ ...mockUser, name: 'Updated' });
    });
    it('should throw NotFoundException if user not found', async () => {
      repository.findOneById.mockResolvedValue(null);
      await expect(service.update('1', { name: 'Updated' })).rejects.toThrow(
        NotFoundException,
      );
    });
    it('should throw if repository throws', async () => {
      repository.findOneById.mockResolvedValue(mockUser);
      repository.update.mockRejectedValue(new Error('fail'));
      await expect(service.update('1', { name: 'Updated' })).rejects.toThrow(
        'fail',
      );
    });
  });

  describe('delete', () => {
    it('should delete if user found', async () => {
      repository.findOneById.mockResolvedValue(mockUser);
      repository.delete.mockResolvedValue(undefined);
      await service.delete('1');
      expect(repository.delete).toHaveBeenCalledWith('1');
    });
    it('should throw NotFoundException if user not found', async () => {
      repository.findOneById.mockResolvedValue(null);
      await expect(service.delete('1')).rejects.toThrow(NotFoundException);
    });
    it('should throw if repository throws', async () => {
      repository.findOneById.mockResolvedValue(mockUser);
      repository.delete.mockRejectedValue(new Error('fail'));
      await expect(service.delete('1')).rejects.toThrow('fail');
    });
  });

  describe('uploadProfilePicture', () => {
    it('should upload and return url', async () => {
      repository.uploadedFile.mockResolvedValue({ url: 'url', path: 'path' });
      const result = await service.uploadProfilePicture(mockFile, '1');
      expect(repository.uploadedFile).toHaveBeenCalledWith(
        mockFile,
        'creator-profile-pictures',
        '1/profilepic',
      );
      expect(result).toBe('url');
    });
    it('should throw if repository throws', async () => {
      repository.uploadedFile.mockRejectedValue(new Error('fail'));
      await expect(service.uploadProfilePicture(mockFile, '1')).rejects.toThrow(
        'fail',
      );
    });
  });

  describe('deleteImage', () => {
    it('should call repository.deleteFile with correct args', async () => {
      repository.deleteFile.mockResolvedValue(undefined);
      await service.deleteImage('1');
      expect(repository.deleteFile).toHaveBeenCalledWith(
        'creator-profile-pictures',
        '1/profilepic',
      );
    });
    it('should throw if repository throws', async () => {
      repository.deleteFile.mockRejectedValue(new Error('fail'));
      await expect(service.deleteImage('1')).rejects.toThrow('fail');
    });
  });
});
