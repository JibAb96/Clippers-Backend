import { Test, TestingModule } from '@nestjs/testing';
import { ClipsController } from './clips.controller';
import { ClipsService } from './clips.service';
import { ClipSubmission } from '../interfaces/clip-submission.interface';
import { SubmitClipDto } from '../dtos/submit-clip.dto';
import { UpdateClipStatusDto } from '../dtos/update-clip-status.dto';
import { ApiResponse } from '../interfaces/api.interface';
import { ClipFileDto } from '../dtos/submit-clip-files.dto';
import { SupabaseUser } from '../interfaces/auth-request.interface';
import { ClipValidationPipe } from './pipes/clip-validation.pipe';
import { ThumbnailValidationPipe } from './pipes/thumbnail-validation.pipe';
import { ClipStatus } from '../enums/clip-status.enum';
import { SupabaseAuthGuard } from '../guards/supabase-auth.guard';

jest.mock('./pipes/clip-validation.pipe');
jest.mock('./pipes/thumbnail-validation.pipe');

// Add mock file definition
const mockFile: Express.Multer.File = {
  fieldname: 'videoFile',
  originalname: 'video.mp4',
  encoding: '7bit',
  mimetype: 'video/mp4',
  size: 123,
  buffer: Buffer.from(''),
  stream: null as any,
  destination: '',
  filename: '',
  path: '',
};

describe('ClipsController', () => {
  let controller: ClipsController;
  let clipsService: jest.Mocked<ClipsService>;

  const mockUser: SupabaseUser = { id: 'user1' } as SupabaseUser;
  const mockSubmission: ClipSubmission = {
    id: 'id',
    creatorId: 'user1',
    clipperId: 'clipper1',
    description: 'desc',
    clipUrl: 'clipUrl',
    thumbnailUrl: 'thumbUrl',
    status: ClipStatus.PENDING,
    title: 'title',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    clipsService = {
      submitClip: jest.fn(),
      updateClipStatus: jest.fn(),
      getClipSubmissionsByCreatorId: jest.fn(),
      getClipSubmissionsByClipperId: jest.fn(),
      getClipSubmissionById: jest.fn(),
    } as any;

    (ClipValidationPipe as any).mockImplementation(() => ({
      transform: jest.fn().mockResolvedValue({ originalname: 'video.mp4' }),
    }));
    (ThumbnailValidationPipe as any).mockImplementation(() => ({
      transform: jest.fn().mockResolvedValue({ originalname: 'thumb.jpg' }),
    }));

    const mockGuard = {
      canActivate: jest.fn().mockReturnValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClipsController],
      providers: [{ provide: ClipsService, useValue: clipsService }],
    })
      .overrideGuard(SupabaseAuthGuard)
      .useValue(mockGuard)
      .compile();

    controller = module.get<ClipsController>(ClipsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('submitClip', () => {
    it('should validate, call service, and return response', async () => {
      const files: any = {
        videoFile: [mockFile],
        thumbnailFile: [
          {
            ...mockFile,
            fieldname: 'thumbnailFile',
            originalname: 'thumb.jpg',
            mimetype: 'image/jpeg',
          },
        ],
      };
      const dto: SubmitClipDto = {
        clipperId: 'clipper1',
        description: 'desc',
        title: 'title',
      };
      clipsService.submitClip.mockResolvedValue(mockSubmission);

      const result = await controller.submitClip(files, dto, mockUser);
      expect(clipsService.submitClip).toHaveBeenCalled();
      expect(result).toEqual({
        status: 'success',
        data: mockSubmission,
        message: 'Clip submitted successfully',
      });
    });

    it('should handle service error', async () => {
      const files: any = {
        videoFile: [mockFile],
        thumbnailFile: [
          {
            ...mockFile,
            fieldname: 'thumbnailFile',
            originalname: 'thumb.jpg',
            mimetype: 'image/jpeg',
          },
        ],
      };
      const dto: SubmitClipDto = {
        clipperId: 'clipper1',
        description: 'desc',
        title: 'title',
      };
      clipsService.submitClip.mockRejectedValue(new Error('fail'));
      await expect(controller.submitClip(files, dto, mockUser)).rejects.toThrow(
        'fail',
      );
    });
  });

  describe('updateClipStatus', () => {
    it('should call service and return response', async () => {
      const dto: UpdateClipStatusDto = {
        clipId: 'id',
        status: ClipStatus.APPROVED,
      };
      clipsService.updateClipStatus.mockResolvedValue(mockSubmission);
      const result = await controller.updateClipStatus(dto, mockUser);
      expect(clipsService.updateClipStatus).toHaveBeenCalledWith(
        dto,
        mockUser.id,
      );
      expect(result).toEqual({
        status: 'success',
        data: mockSubmission,
        message: 'Clip status updated successfully',
      });
    });
    it('should handle service error', async () => {
      const dto: UpdateClipStatusDto = {
        clipId: 'id',
        status: ClipStatus.APPROVED,
      };
      clipsService.updateClipStatus.mockRejectedValue(new Error('fail'));
      await expect(controller.updateClipStatus(dto, mockUser)).rejects.toThrow(
        'fail',
      );
    });
  });

  describe('getClipSubmissionsByCreatorId', () => {
    it('should call service and return response', async () => {
      clipsService.getClipSubmissionsByCreatorId.mockResolvedValue([
        mockSubmission,
      ]);
      const result = await controller.getClipSubmissionsByCreatorId(mockUser);
      expect(clipsService.getClipSubmissionsByCreatorId).toHaveBeenCalledWith(
        mockUser.id,
      );
      expect(result).toEqual({
        status: 'success',
        data: [mockSubmission],
        message: 'Creator clip submissions fetched successfully',
      });
    });
    it('should handle service error', async () => {
      clipsService.getClipSubmissionsByCreatorId.mockRejectedValue(
        new Error('fail'),
      );
      await expect(
        controller.getClipSubmissionsByCreatorId(mockUser),
      ).rejects.toThrow('fail');
    });
  });

  describe('getClipSubmissionsByClipperId', () => {
    it('should call service and return response', async () => {
      clipsService.getClipSubmissionsByClipperId.mockResolvedValue([
        mockSubmission,
      ]);
      const result = await controller.getClipSubmissionsByClipperId(mockUser);
      expect(clipsService.getClipSubmissionsByClipperId).toHaveBeenCalledWith(
        mockUser.id,
      );
      expect(result).toEqual({
        status: 'success',
        data: [mockSubmission],
        message: 'Clipper submissions fetched successfully',
      });
    });
    it('should handle service error', async () => {
      clipsService.getClipSubmissionsByClipperId.mockRejectedValue(
        new Error('fail'),
      );
      await expect(
        controller.getClipSubmissionsByClipperId(mockUser),
      ).rejects.toThrow('fail');
    });
  });

  describe('getClipSubmissionById', () => {
    it('should call service and return response', async () => {
      clipsService.getClipSubmissionById.mockResolvedValue(mockSubmission);
      const result = await controller.getClipSubmissionById('id', mockUser);
      expect(clipsService.getClipSubmissionById).toHaveBeenCalledWith(
        'id',
        mockUser.id,
      );
      expect(result).toEqual({
        status: 'success',
        data: mockSubmission,
        message: 'Clip submission fetched successfully',
      });
    });
    it('should handle service error', async () => {
      clipsService.getClipSubmissionById.mockRejectedValue(new Error('fail'));
      await expect(
        controller.getClipSubmissionById('id', mockUser),
      ).rejects.toThrow('fail');
    });
  });
});
