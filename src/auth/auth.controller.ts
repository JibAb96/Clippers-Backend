import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseFilePipeBuilder,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { RegisterCreatorDto } from './dtos/creators/register-creator.dto';
import { UpdateCreatorDto } from './dtos/creators/update-creator.dto';
import { SupabaseAuthGuard } from '../guards/supabase-auth.guard';
import { SignInUserDto } from './dtos/signin-user.dto';
import { UserFacadeService } from './user-facade.service';
import { UserResponse } from '../interfaces/user-auth-response.interface';
import { ApiResponse } from '../interfaces/api.interface';
import { CreatorProfileInterface } from 'src/interfaces/creator-profle.interface';
import { CurrentUser } from '../decorators/current-user.decorator';
import { SupabaseUser } from '../interfaces/auth-request.interface';
import { FileInterceptor } from '@nestjs/platform-express';
import { RegisterClipperDto } from './dtos/clippers/register-clipper.dto';
import { UpdateClipperDto } from './dtos/clippers/update-clipper.dto';
import { ClipperInterface } from '../interfaces/clipper-profile.interface';
import { ChangePasswordDto } from './dtos/change-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly userFacade: UserFacadeService) {}

  @Post('/register/creator')
  async registerCreator(
    @Body() body: RegisterCreatorDto,
  ): Promise<ApiResponse<UserResponse>> {
    const response = await this.userFacade.registerCreator(body);
    return {
      status: 'success',
      data: response,
      message: 'User registered successfully',
    };
  }

  @Post('/register/clipper')
  async registerClipper(
    @Body() body: RegisterClipperDto,
  ): Promise<ApiResponse<UserResponse>> {
    const response = await this.userFacade.registerClipper(body);
    return {
      status: 'success',
      data: response,
      message: 'User registered successfully',
    };
  }

  @Post('/login/creator')
  async loginCreator(
    @Body() body: SignInUserDto,
  ): Promise<ApiResponse<UserResponse>> {
    const response = await this.userFacade.authenticateCreator(body);
    return {
      status: 'success',
      data: response,
      message: 'Creator logged in successfully',
    };
  }

  @Post('/login/clipper')
  async loginClipper(
    @Body() body: SignInUserDto,
  ): Promise<ApiResponse<UserResponse>> {
    const response = await this.userFacade.authenticateClipper(body);
    return {
      status: 'success',
      data: response,
      message: 'Clipper logged in successfully',
    };
  }
  @UseGuards(SupabaseAuthGuard)
  @Post('/upload-creator-image')
  @UseInterceptors(FileInterceptor('image'))
  async uploadCreatorImage(
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: /(jpg|jpeg|png|webp)/,
        })
        .addMaxSizeValidator({
          maxSize: 1024 * 1024 * 2, // 2MB
        })
        .build({
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        }),
    )
    image: Express.Multer.File,
    @CurrentUser() currentUser: SupabaseUser,
  ): Promise<ApiResponse<string | null>> {
    console.log('image:', image);
    const response = await this.userFacade.uploadCreatorImage(
      image,
      currentUser.id,
    );
    return {
      status: 'success',
      data: response,
      message: 'Image successfully uploaded',
    };
  }

  @UseGuards(SupabaseAuthGuard)
  @Post('/upload-clipper-image')
  @UseInterceptors(FileInterceptor('image'))
  async uploadClipperImage(
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: /(jpg|jpeg|png|webp)/,
        })
        .addMaxSizeValidator({
          maxSize: 1024 * 1024 * 2, // 2MB
        })
        .build({
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        }),
    )
    image: Express.Multer.File,
    @CurrentUser() currentUser: SupabaseUser,
  ): Promise<ApiResponse<string | null>> {
    const response = await this.userFacade.uploadClipperImage(
      image,
      currentUser.id,
    );
    return {
      status: 'success',
      data: response,
      message: 'Clipper image successfully uploaded',
    };
  }

  @UseGuards(SupabaseAuthGuard)
  @Get('/creator/:id')
  async getCreatorProfile(
    @Param('id') id: string,
  ): Promise<ApiResponse<CreatorProfileInterface | null>> {
    const response = await this.userFacade.getCreatorProfile(id);
    return {
      status: 'success',
      data: response,
      message: 'Creator profile found successfully',
    };
  }

  @UseGuards(SupabaseAuthGuard)
  @Get('/get-clipper-profile')
  async getClipperProfile(
    @CurrentUser() currentUser: SupabaseUser,
  ): Promise<ApiResponse<ClipperInterface | null>> {
    const response = await this.userFacade.getClipperProfile(currentUser.id);
    return {
      status: 'success',
      data: response,
      message: 'Clipper profile found successfully',
    };
  }

  @UseGuards(SupabaseAuthGuard)
  @Delete('/delete-user')
  async removeUser(
    @CurrentUser() currentUser: SupabaseUser,
    id: string
  ): Promise<ApiResponse<{ success: boolean; message: string }>> {
    const response = await this.userFacade.deleteUser(currentUser.id);
    return {
      status: 'success',
      data: response,
      message: 'User removed successfully',
    };
  }
  @UseGuards(SupabaseAuthGuard)
  @Patch('/update-creator-profile')
  async updateUser(
    @Param('id') id: string,
    @Body() body: UpdateCreatorDto,
    @CurrentUser() currentUser: SupabaseUser,
  ): Promise<ApiResponse<CreatorProfileInterface>> {
    const response = await this.userFacade.updateUserProfile(
      body,
      currentUser.id,
    );
    return {
      status: 'success',
      data: response,
      message: 'User updated successfully',
    };
  }

  @UseGuards(SupabaseAuthGuard)
  @Patch('/update-clipper-profile')
  async updateClipperProfile(
    @Body() body: UpdateClipperDto,
    @CurrentUser() currentUser: SupabaseUser,
  ): Promise<ApiResponse<ClipperInterface>> {
    const response = await this.userFacade.updateClipperProfile(
      currentUser.id,
      body,
    );
    return {
      status: 'success',
      data: response,
      message: 'Clipper profile updated successfully',
    };
  }

  @UseGuards(SupabaseAuthGuard)
  @Delete('/delete-creator-image')
  async deleteProfileImage(
    @CurrentUser() currentUser: SupabaseUser,
  ): Promise<ApiResponse<{ success: boolean; message: string }>> {
    const response = await this.userFacade.deleteProfileImage(currentUser.id);
    return {
      status: 'success',
      data: response,
      message: response.message,
    };
  }

  @UseGuards(SupabaseAuthGuard)
  @Patch('/change-password')
  async changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<ApiResponse<{ success: boolean; message: string }>> {
    const response = await this.userFacade.changePassword(
      changePasswordDto.newPassword,
    );
    return {
      status: 'success',
      data: response,
      message: response.message,
    };
  }
}
