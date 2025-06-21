import { Test, TestingModule } from '@nestjs/testing';
import { ClipsService } from './clips.service';
import { ClipsRepository } from './clips.repository';
import { SupabaseService } from '../supabase/supabase.service';
import { ForbiddenException } from '@nestjs/common';
import { SubmitClipDto } from '../dtos/submit-clip.dto';
import { UpdateClipStatusDto } from '../dtos/update-clip-status.dto';
import { ClipSubmission } from '../interfaces/clip-submission.interface';
import { ClipStatus } from "../enums/clip-status.enum";

describe('ClipsService', () => {
  let service: ClipsService;
  let clipsRepository: jest.Mocked<ClipsRepository>;
  let supabaseService: jest.Mocked<SupabaseService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClipsService,
        {
          provide: ClipsRepository,
          useValue: {
            createClipSubmission: jest.fn(),
            updateClipStatus: jest.fn(),
            getClipSubmissionsByCreatorId: jest.fn(),
            getClipSubmissionsByClipperId: jest.fn(),
            getClipSubmissionById: jest.fn(),
            rollbackClipSubmission: jest.fn(),
          },
        },
        {
          provide: SupabaseService,
          useValue: {
            uploadFile: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ClipsService>(ClipsService);
    clipsRepository = module.get(ClipsRepository);
    supabaseService = module.get(SupabaseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('submitClip', () => {
    const clipFile = {
      originalname: 'video.mp4',
      buffer: Buffer.from('clip'),
      mimetype: 'video/mp4',
    } as Express.Multer.File;
    const thumbnailFile = {
      originalname: 'thumb.jpg',
      buffer: Buffer.from('thumb'),
      mimetype: 'image/jpeg',
    } as Express.Multer.File;
    const submitClipDto: SubmitClipDto = {
      clipperId: 'clipper1',
      description: 'desc',
      title: 'title',
    };
    const userId = 'user1';
    const clipUrl = 'https://public/clip.mp4';
    const thumbnailUrl = 'https://public/thumb.jpg';
    const submission: ClipSubmission = {
      id: 'id',
      creatorId: userId,
      clipperId: submitClipDto.clipperId,
      description: submitClipDto.description,
      clipUrl,
      thumbnailUrl,
      status: ClipStatus.PENDING,
      title: submitClipDto.title,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should upload files and create submission', async () => {
      supabaseService.uploadFile
        .mockResolvedValueOnce(clipUrl)
        .mockResolvedValueOnce(thumbnailUrl);
      clipsRepository.createClipSubmission.mockResolvedValue(submission);

      const result = await service.submitClip(
        clipFile,
        thumbnailFile,
        submitClipDto,
        userId,
      );
      expect(supabaseService.uploadFile).toHaveBeenCalledTimes(2);
      expect(clipsRepository.createClipSubmission).toHaveBeenCalledWith(
        userId,
        clipUrl,
        submitClipDto.description,
        submitClipDto.clipperId,
        thumbnailUrl,
        submitClipDto.title,
      );
      expect(result).toEqual(submission);
    });

    it('should rollback clip if thumbnail upload or db fails', async () => {
      supabaseService.uploadFile.mockResolvedValueOnce(clipUrl);
      supabaseService.uploadFile.mockRejectedValueOnce(new Error('fail'));
      clipsRepository.rollbackClipSubmission.mockResolvedValue();

      await expect(
        service.submitClip(clipFile, thumbnailFile, submitClipDto, userId),
      ).rejects.toThrow('fail');
      expect(clipsRepository.rollbackClipSubmission).toHaveBeenCalledWith(
        clipUrl,
      );
    });

    it('should throw if clip upload fails', async () => {
      supabaseService.uploadFile.mockRejectedValueOnce(new Error('clip fail'));
      await expect(
        service.submitClip(clipFile, thumbnailFile, submitClipDto, userId),
      ).rejects.toThrow('clip fail');
    });
  });

  describe('updateClipStatus', () => {
    const dto: UpdateClipStatusDto = { clipId: 'id', status: ClipStatus.APPROVED };
    const clipperId = 'clipper1';
    const submission = { id: 'id' } as ClipSubmission;

    it('should update and return submission', async () => {
      clipsRepository.updateClipStatus.mockResolvedValue(submission);
      const result = await service.updateClipStatus(dto, clipperId);
      expect(clipsRepository.updateClipStatus).toHaveBeenCalledWith(
        'id',
        'approved',
        clipperId,
      );
      expect(result).toBe(submission);
    });

    it('should throw if repository throws', async () => {
      clipsRepository.updateClipStatus.mockRejectedValue(new Error('fail'));
      await expect(service.updateClipStatus(dto, clipperId)).rejects.toThrow(
        'fail',
      );
    });
  });

  describe('getClipSubmissionsByCreatorId', () => {
    it('should return submissions', async () => {
      const arr = [{} as ClipSubmission];
      clipsRepository.getClipSubmissionsByCreatorId.mockResolvedValue(arr);
      const result = await service.getClipSubmissionsByCreatorId('creator');
      expect(result).toBe(arr);
    });
    it('should throw if repository throws', async () => {
      clipsRepository.getClipSubmissionsByCreatorId.mockRejectedValue(
        new Error('fail'),
      );
      await expect(
        service.getClipSubmissionsByCreatorId('creator'),
      ).rejects.toThrow('fail');
    });
  });

  describe('getClipSubmissionsByClipperId', () => {
    it('should return submissions', async () => {
      const arr = [{} as ClipSubmission];
      clipsRepository.getClipSubmissionsByClipperId.mockResolvedValue(arr);
      const result = await service.getClipSubmissionsByClipperId('clipper');
      expect(result).toBe(arr);
    });
    it('should throw if repository throws', async () => {
      clipsRepository.getClipSubmissionsByClipperId.mockRejectedValue(
        new Error('fail'),
      );
      await expect(
        service.getClipSubmissionsByClipperId('clipper'),
      ).rejects.toThrow('fail');
    });
  });

  describe('getClipSubmissionById', () => {
    const userId = 'user1';
    const clip = { creatorId: userId, clipperId: 'clipper2' } as ClipSubmission;
    it('should return clip if user is creator', async () => {
      clipsRepository.getClipSubmissionById.mockResolvedValue(clip);
      const result = await service.getClipSubmissionById('id', userId);
      expect(result).toBe(clip);
    });
    it('should return clip if user is clipper', async () => {
      const clip2 = { creatorId: 'other', clipperId: userId } as ClipSubmission;
      clipsRepository.getClipSubmissionById.mockResolvedValue(clip2);
      const result = await service.getClipSubmissionById('id', userId);
      expect(result).toBe(clip2);
    });
    it('should throw ForbiddenException if user is neither', async () => {
      const clip3 = { creatorId: 'a', clipperId: 'b' } as ClipSubmission;
      clipsRepository.getClipSubmissionById.mockResolvedValue(clip3);
      await expect(service.getClipSubmissionById('id', userId)).rejects.toThrow(
        ForbiddenException,
      );
    });
    it('should throw if repository throws', async () => {
      clipsRepository.getClipSubmissionById.mockRejectedValue(
        new Error('fail'),
      );
      await expect(service.getClipSubmissionById('id', userId)).rejects.toThrow(
        'fail',
      );
    });
  });
});
