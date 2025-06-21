import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { UserFacadeService } from './user-facade.service';
import { RegisterCreatorDto } from './dtos/creators/register-creator.dto';
import { RegisterClipperDto } from './dtos/clippers/register-clipper.dto';
import { SignInUserDto } from './dtos/signin-user.dto';
import { ChangePasswordDto } from './dtos/change-password.dto';
import { SupabaseUser } from '../interfaces/auth-request.interface';
import { SupabaseAuthGuard } from '../guards/supabase-auth.guard';
import { ExecutionContext } from '@nestjs/common';

describe('AuthController', () => {
  let controller: AuthController;
  let mockUserFacade: Partial<UserFacadeService>;

  beforeEach(async () => {
    mockUserFacade = {
      registerCreator: jest.fn(),
      registerClipper: jest.fn(),
      authenticateCreator: jest.fn(),
      authenticateClipper: jest.fn(),
      uploadCreatorImage: jest.fn(),
      uploadClipperImage: jest.fn(),
      getCreatorProfile: jest.fn(),
      getClipperProfile: jest.fn(),
      changePassword: jest.fn(),
      deleteUser: jest.fn(),
      updateUserProfile: jest.fn(),
      updateClipperProfile: jest.fn(),
      deleteProfileImage: jest.fn(),
    };

    // Mock the guard to always allow
    const mockGuard = {
      canActivate: jest.fn().mockReturnValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: UserFacadeService, useValue: mockUserFacade },
        { provide: SupabaseAuthGuard, useValue: mockGuard },
      ],
    })
      .overrideGuard(SupabaseAuthGuard)
      .useValue(mockGuard)
      .compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('registerCreator', () => {
    it('should call userFacade.registerCreator and return ApiResponse', async () => {
      const dto = {} as RegisterCreatorDto;
      const userResponse = {
        user: { id: '1' },
        role: 'creator',
        token: 'token',
        refreshToken: 'refresh',
      };
      (mockUserFacade.registerCreator as jest.Mock).mockResolvedValue(
        userResponse,
      );
      const result = await controller.registerCreator(dto);
      expect(result).toEqual({
        status: 'success',
        data: userResponse,
        message: 'User registered successfully',
      });
      expect(mockUserFacade.registerCreator).toHaveBeenCalledWith(dto);
    });
  });

  describe('registerClipper', () => {
    it('should call userFacade.registerClipper and return ApiResponse', async () => {
      const dto = {} as RegisterClipperDto;
      const userResponse = {
        user: { id: '2' },
        role: 'clipper',
        token: 'token',
        refreshToken: 'refresh',
      };
      (mockUserFacade.registerClipper as jest.Mock).mockResolvedValue(
        userResponse,
      );
      const result = await controller.registerClipper(dto);
      expect(result).toEqual({
        status: 'success',
        data: userResponse,
        message: 'User registered successfully',
      });
      expect(mockUserFacade.registerClipper).toHaveBeenCalledWith(dto);
    });
  });

  describe('loginCreator', () => {
    it('should call userFacade.authenticateCreator and return ApiResponse', async () => {
      const dto = {} as SignInUserDto;
      const userResponse = {
        user: { id: '1' },
        role: 'creator',
        token: 'token',
        refreshToken: 'refresh',
      };
      (mockUserFacade.authenticateCreator as jest.Mock).mockResolvedValue(
        userResponse,
      );
      const result = await controller.loginCreator(dto);
      expect(result).toEqual({
        status: 'success',
        data: userResponse,
        message: 'Creator logged in successfully',
      });
      expect(mockUserFacade.authenticateCreator).toHaveBeenCalledWith(dto);
    });
  });

  describe('loginClipper', () => {
    it('should call userFacade.authenticateClipper and return ApiResponse', async () => {
      const dto = {} as SignInUserDto;
      const userResponse = {
        user: { id: '2' },
        role: 'clipper',
        token: 'token',
        refreshToken: 'refresh',
      };
      (mockUserFacade.authenticateClipper as jest.Mock).mockResolvedValue(
        userResponse,
      );
      const result = await controller.loginClipper(dto);
      expect(result).toEqual({
        status: 'success',
        data: userResponse,
        message: 'Clipper logged in successfully',
      });
      expect(mockUserFacade.authenticateClipper).toHaveBeenCalledWith(dto);
    });
  });

  describe('uploadCreatorImage', () => {
    it('should call userFacade.uploadCreatorImage and return ApiResponse', async () => {
      const image = {} as Express.Multer.File;
      const currentUser = { id: '1' } as SupabaseUser;
      (mockUserFacade.uploadCreatorImage as jest.Mock).mockResolvedValue(
        'image uploaded successfully',
      );
      const result = await controller.uploadCreatorImage(image, currentUser);
      expect(result).toEqual({
        status: 'success',
        data: 'image uploaded successfully',
        message: 'Image successfully uploaded',
      });
      expect(mockUserFacade.uploadCreatorImage).toHaveBeenCalledWith(
        image,
        currentUser.id,
      );
    });
  });

  describe('uploadClipperImage', () => {
    it('should call userFacade.uploadClipperImage and return ApiResponse', async () => {
      const image = {} as Express.Multer.File;
      const currentUser = { id: '2' } as SupabaseUser;
      (mockUserFacade.uploadClipperImage as jest.Mock).mockResolvedValue(
        'clipper image uploaded',
      );
      const result = await controller.uploadClipperImage(image, currentUser);
      expect(result).toEqual({
        status: 'success',
        data: 'clipper image uploaded',
        message: 'Clipper image successfully uploaded',
      });
      expect(mockUserFacade.uploadClipperImage).toHaveBeenCalledWith(
        image,
        currentUser.id,
      );
    });
  });

  describe('getCreatorProfile', () => {
    it('should call userFacade.getCreatorProfile and return ApiResponse', async () => {
      const id = '1';
      const profile = { id: '1', fullName: 'Test' };
      (mockUserFacade.getCreatorProfile as jest.Mock).mockResolvedValue(
        profile,
      );
      const result = await controller.getCreatorProfile(id);
      expect(result).toEqual({
        status: 'success',
        data: profile,
        message: 'Creator profile found successfully',
      });
      expect(mockUserFacade.getCreatorProfile).toHaveBeenCalledWith(id);
    });
  });

  describe('getClipperProfile', () => {
    it('should call userFacade.getClipperProfile and return ApiResponse', async () => {
      const currentUser = { id: '2' } as SupabaseUser;
      const profile = { id: '2', fullName: 'Clipper' };
      (mockUserFacade.getClipperProfile as jest.Mock).mockResolvedValue(
        profile,
      );
      const result = await controller.getClipperProfile(currentUser);
      expect(result).toEqual({
        status: 'success',
        data: profile,
        message: 'Clipper profile found successfully',
      });
      expect(mockUserFacade.getClipperProfile).toHaveBeenCalledWith(
        currentUser.id,
      );
    });
  });

  describe('changePassword', () => {
    it('should call userFacade.changePassword and return ApiResponse', async () => {
      const dto = { newPassword: 'newpass' } as ChangePasswordDto;
      const response = {
        success: true,
        message: 'Password changed successfully',
      };
      (mockUserFacade.changePassword as jest.Mock).mockResolvedValue(response);
      const result = await controller.changePassword(dto);
      expect(result).toEqual({
        status: 'success',
        data: response,
        message: 'Password changed successfully',
      });
      expect(mockUserFacade.changePassword).toHaveBeenCalledWith(
        dto.newPassword,
      );
    });
  });

  describe('removeUser', () => {
    it('should call userFacade.deleteUser and return ApiResponse', async () => {
      const currentUser = { id: '3' } as SupabaseUser;
      const response = { success: true, message: 'Account deleted' };
      (mockUserFacade.deleteUser as jest.Mock).mockResolvedValue(response);
      // removeUser expects two arguments, but only uses currentUser.id
      const result = await controller.removeUser(currentUser, currentUser.id);
      expect(result).toEqual({
        status: 'success',
        data: response,
        message: 'User removed successfully',
      });
      expect(mockUserFacade.deleteUser).toHaveBeenCalledWith(currentUser.id);
    });
  });

  describe('updateUser', () => {
    it('should call userFacade.updateUserProfile and return ApiResponse', async () => {
      const id = '4';
      const body = { fullName: 'Updated' };
      const currentUser = { id: '4' } as SupabaseUser;
      const updatedProfile = { id: '4', fullName: 'Updated' };
      (mockUserFacade.updateUserProfile as jest.Mock).mockResolvedValue(
        updatedProfile,
      );
      const result = await controller.updateUser(id, body, currentUser);
      expect(result).toEqual({
        status: 'success',
        data: updatedProfile,
        message: 'User updated successfully',
      });
      expect(mockUserFacade.updateUserProfile).toHaveBeenCalledWith(
        body,
        currentUser.id,
      );
    });
  });

  describe('updateClipperProfile', () => {
    it('should call userFacade.updateClipperProfile and return ApiResponse', async () => {
      const body = { fullName: 'Clipper Updated' };
      const currentUser = { id: '5' } as SupabaseUser;
      const updatedProfile = { id: '5', fullName: 'Clipper Updated' };
      (mockUserFacade.updateClipperProfile as jest.Mock).mockResolvedValue(
        updatedProfile,
      );
      const result = await controller.updateClipperProfile(body, currentUser);
      expect(result).toEqual({
        status: 'success',
        data: updatedProfile,
        message: 'Clipper profile updated successfully',
      });
      expect(mockUserFacade.updateClipperProfile).toHaveBeenCalledWith(
        currentUser.id,
        body,
      );
    });
  });

  describe('deleteProfileImage', () => {
    it('should call userFacade.deleteProfileImage and return ApiResponse', async () => {
      const currentUser = { id: '6' } as SupabaseUser;
      const response = { success: true, message: 'Profile image deleted' };
      (mockUserFacade.deleteProfileImage as jest.Mock).mockResolvedValue(
        response,
      );
      const result = await controller.deleteProfileImage(currentUser);
      expect(result).toEqual({
        status: 'success',
        data: response,
        message: 'Profile image deleted',
      });
      expect(mockUserFacade.deleteProfileImage).toHaveBeenCalledWith(
        currentUser.id,
      );
    });
  });
});
