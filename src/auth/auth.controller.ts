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
import { SupabaseAuthGuard } from './guards/supabase-auth.guard';
import { SignInUserDto } from './dtos/signin-user.dto';
import { UserFacadeService } from './user-facade.service';
import { UserResponse } from '../interfaces/auth-response.dto';
import { ApiResponse } from './interfaces/api.interface';
import { CreatorProfileInterface } from 'src/interfaces/creator-profle.interface';
import { CurrentUser } from './decorators/current-user.decorator';
import { SupabaseUser } from './interfaces/auth-request.interface';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadImageDto } from './dtos/upload-image.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly userFacade: UserFacadeService) {}

  @Post('/register')
  async registerCreator(
    @Body() body: RegisterCreatorDto,
  ): Promise<ApiResponse<UserResponse>> {
    const response = await this.userFacade.register(body);
    return {
      status: 'success',
      data: response,
      message: 'User registered successfully',
    };
  }

  @Post('/login')
  async login(@Body() body: SignInUserDto): Promise<ApiResponse<UserResponse>> {
    const response = await this.userFacade.authenticateUser(body);
    return {
      status: 'success',
      data: response,
      message: 'User logged in successfully',
    };
  }

  @UseGuards(SupabaseAuthGuard)
  @Post('/upload-image')
  @UseInterceptors(FileInterceptor('image'))
  async uploadImage(
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
    @CurrentUser()
    currentUser: SupabaseUser,
    @Body()
    body: UploadImageDto,
  ) {
    console.log('image:', image);
    const response = await this.userFacade.uploadImage(
      image,
      body.brandName,
      currentUser.id,
    );
    return {
      status: 'success',
      data: response,
      message: 'Image successfully uploaded',
    };
  }

  @UseGuards(SupabaseAuthGuard)
  @Get('/:id')
  async findUser(
    @Param('id') id: string,
    @CurrentUser() currentUser: SupabaseUser,
  ): Promise<ApiResponse<CreatorProfileInterface | null>> {
    const response = await this.userFacade.getUserProfile(id, currentUser.id);
    return {
      status: 'success',
      data: response,
      message: 'User found successfully',
    };
  }

  @UseGuards(SupabaseAuthGuard)
  @Delete('/:id')
  async removeUser(
    @Param('id') id: string,
    @CurrentUser() currentUser: SupabaseUser,
  ): Promise<ApiResponse<{ success: boolean; message: string }>> {
    const response = await this.userFacade.deleteUser(id, currentUser.id);
    return {
      status: 'success',
      data: response,
      message: 'User removed successfully',
    };
  }
  @UseGuards(SupabaseAuthGuard)
  @Patch('/:id')
  async updateUser(
    @Param('id') id: string,
    @Body() body: UpdateCreatorDto,
    @CurrentUser() currentUser: SupabaseUser,
  ): Promise<ApiResponse<CreatorProfileInterface>> {
    const response = await this.userFacade.updateUserProfile(
      id,
      body,
      currentUser.id,
    );
    return {
      status: 'success',
      data: response,
      message: 'User updated successfully',
    };
  }
}
