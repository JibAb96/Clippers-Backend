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
  UploadedFiles,
  UseGuards,
  UseInterceptors,
  Query,
} from '@nestjs/common';
import { ClippersFacadeService } from './clippers-facade.service';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { UploadImageDto } from '../dtos/upload-image.dto';
import { SupabaseAuthGuard } from '../guards/supabase-auth.guard';
import { CreateGuidelineDto } from './dtos/guidelines.dto';
import { GuidleinesInterface } from './interfaces/guidlines.interface';
import { CurrentUser } from "../decorators/current-user.decorator";
import { SupabaseUser } from "../interfaces/auth-request.interface";
import { UploadFileResponse } from "../interfaces/upload-response.interface";
import { ApiResponse } from "../interfaces/api.interface";
import { PortfolioResponse } from "./interfaces/portfolio-response.interface";
import { ClipperInterface } from "../interfaces/clipper-profile.interface";

@Controller('clippers')
export class ClippersController {
  constructor(private readonly clippersFacade: ClippersFacadeService) {}

  @Get()
  async getClippers(): Promise<ApiResponse<ClipperInterface[] | null>> {
    const response = await this.clippersFacade.getClippers();
    return {
      status: 'success',
      data: response,
      message: 'Clippers fetched successfully',
    };
  }

  @Get('/:clipperId')
  async getClipperById(@Param('clipperId') clipperId: string) {
    const response = await this.clippersFacade.getClipperById(clipperId);
    return {
      status: 'success',
      data: response,
      message: 'Clipper fetched successfully',
    };
  }

  @UseGuards(SupabaseAuthGuard)
  @Post('upload-clipper-image')
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
  ): Promise<ApiResponse<ClipperInterface>> {
    const response = await this.clippersFacade.uploadClipperImage(
      image,
      currentUser.id,
    );
    return {
      status: 'success',
      data: response,
      message: 'Clipper image uploaded successfully',
    };
  }

  @UseGuards(SupabaseAuthGuard)
  @Delete('/delete-clipper-image')
  async deleteClipperImage(
    @CurrentUser() currentUser: SupabaseUser,
  ): Promise<ApiResponse<{ success: boolean; message: string }>> {
    const response = await this.clippersFacade.deleteClipperImage(
      currentUser.id,
    );
    return {
      status: 'success',
      data: response,
      message: response.message,
    };
  }

  @UseGuards(SupabaseAuthGuard)
  @Post('upload-portfolio-images')
  @UseInterceptors(FilesInterceptor('image', 4))
  async uploadPortfolioImages(
    @UploadedFiles() images: Express.Multer.File[],
    @CurrentUser() currentUser: SupabaseUser,
  ): Promise<ApiResponse<PortfolioResponse[]>> {
    if (!images || images.length === 0) {
      return {
        status: 'error',
        data: [],
        message: 'No images uploaded',
      };
    }
    if (images.length > 4) {
      return {
        status: 'error',
        data: [],
        message: 'You can upload a maximum of 4 images',
      };
    }

    const uploadResults = await this.clippersFacade.uploadPortfolioImage(
      images,
      currentUser.id,
    );

    return {
      status: 'success',
      data: uploadResults,
      message: 'Portfolio images successfully uploaded',
    };
  }

  @UseGuards(SupabaseAuthGuard)
  @Delete('delete-portfolio-image/:imageId')
  async deletePortfolioImage(
    @CurrentUser() currentUser: SupabaseUser,
    @Param('imageId') imageId: string,
  ): Promise<ApiResponse<void>> {
    const response = await this.clippersFacade.deletePortfolioImage(
      currentUser.id,
      imageId,
    );
    return {
      status: 'success',
      data: response,
      message: 'Portfolio image deleted successfully',
    };
  }

  @UseGuards(SupabaseAuthGuard)
  @Post('guidelines')
  async createGuidelines(
    @Body() body: CreateGuidelineDto,
    @CurrentUser() currentUser: SupabaseUser,
  ): Promise<ApiResponse<GuidleinesInterface>> {
    const response = await this.clippersFacade.createGuidelines({
      ...body,
      clipperId: currentUser.id,
    });
    return {
      status: 'success',
      data: response,
      message: 'Guidelines successfully created',
    };
  }

  @UseGuards(SupabaseAuthGuard)
  @Patch('guidelines/:id')
  async updateGuidelines(
    @Param('id') id: string,
    @Body() body: GuidleinesInterface,
  ) {
    const response = await this.clippersFacade.updateGuidelines(id, body);
    return {
      status: 'success',
      data: response,
      message: 'Guidelines successfully updated',
    };
  }

  @UseGuards(SupabaseAuthGuard)
  @Delete('guidelines/:id')
  async deleteGuidelines(@Param('id') id: string) {
    const response = await this.clippersFacade.deleteGuidelines(id);
    return {
      status: 'success',
      data: response,
      message: 'Guidelines successfully deleted',
    };
  }
}
