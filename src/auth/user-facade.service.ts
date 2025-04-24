import {
  Injectable,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
  Logger,
  HttpException,
  HttpStatus,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreatorsService } from '../creators/creators.service';
import { RegisterCreatorDto } from './dtos/creators/register-creator.dto';
import { SignInUserDto } from './dtos/signin-user.dto';
import { UpdateCreatorDto } from './dtos/creators/update-creator.dto';
import { CreatorProfileInterface } from '../interfaces/creator-profle.interface';
import { UserResponse } from '../interfaces/auth-response.dto';
import { AuthResponse } from './interfaces/auth-response.interface';
@Injectable()
export class UserFacadeService {
  private readonly logger = new Logger(UserFacadeService.name);

  constructor(
    private readonly authService: AuthService,
    private readonly creatorsService: CreatorsService,
  ) {}

  async register(
    userData: RegisterCreatorDto,
  ): Promise<UserResponse> {
    if (userData.password !== userData.confirmPassword) {
      throw new BadRequestException('Password and confirm password must match');
    }
    let authData: AuthResponse | null = null;
    let profileCreated = false;
    try {
      authData = await this.authService.register({
        email: userData.email,
        password: userData.password,
      });
      if (!authData?.id) {
        this.logger.log('Auth registration failed to return a user ID');
        throw new InternalServerErrorException(
          'There was an internal server error',
        );
      }


      const { confirmPassword, password, ...user } = userData;
      const userProfile = await this.creatorsService.create({
        id: authData.id,
        ...user,
      });
      profileCreated = true;

      return {
        user: userProfile,
        token: authData.token,
        refreshToken: authData.refreshToken,
      };
    } catch (error) {
      try {
        if (authData?.id && !profileCreated) {
          await this.authService.deleteUser(authData.id);
          this.logger.log(
            `Rolled back auth user ${authData.id} after failed registration`,
          );
          this.logger.log(`Rollback completed for user ${authData.id} but profile creation failed`);
        }
      } catch (rollbackError) {
        this.logger.error(`Rollback failed: ${rollbackError.message}`);
        throw new InternalServerErrorException(
          'Registration failed due to an internal server error',
        );
      }

      if (error.message?.includes('duplicate key')) {
        throw new ConflictException('User with this email already exists');
      }
      this.logger.error(`Registration failed: ${error.message}`);
      throw new InternalServerErrorException(
        'Registration failed due to an internal error',
      );
    }
  }

  async authenticateUser(credentials: SignInUserDto): Promise<UserResponse> {
    const authData = await this.authService.signin({
      email: credentials.email,
      password: credentials.password,
    });
    try {
      if (authData.id) {
        const creatorProfile = await this.creatorsService.findOneById(
          authData.id,
        );

        if (!creatorProfile) {
          throw new Error('Authentication succeeded but profile not found');
        }
        return {
          user: creatorProfile,
          token: authData.token,
          refreshToken: authData.refreshToken,
        };
      }
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    } catch (error) {
      this.logger.error(`Signin failed: ${error.message}`, error.stack);

      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error.message?.includes('Database error')) {
        throw new InternalServerErrorException(
          'Authentication service unavailable',
        );
      }
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }
  }

  async uploadImage(image: Express.Multer.File, brandName: string, id: string): Promise<string | null> {
    let imageUrl: string | null = null;
    try {
      const response = await this.creatorsService.uploadProfilePicture(image, brandName);
      imageUrl = response?.url || null;
      try{
         await this.creatorsService.update(id, {
          brandProfilePic: imageUrl
        })
      } catch (error) {
        this.logger.error(`Updating user profile picture failed: ${error.message}`, error.stack);
        throw new InternalServerErrorException(
          'There was an internal server error updating the user profile',
        );
      }
    } catch (error) {
      this.logger.error(`Image upload failed: ${error.message}`, error.stack);
      throw new InternalServerErrorException(
        'There was an internal server error uploading the image',
      );
    }
    return imageUrl
  }

  async getUserProfile(
    userId: string,
    requestUser: any,
  ): Promise<CreatorProfileInterface | null> {
    this.ensureSameUser(userId, requestUser);

    const profile = await this.creatorsService.findOneById(userId);
    return profile;
  }

  async updateUserProfile(
    userId: string,
    userData: UpdateCreatorDto,
    requestUser: any,
  ): Promise<CreatorProfileInterface> {
    try {
      this.ensureSameUser(userId, requestUser);
      const updatedUser = await this.creatorsService.update(userId, userData);
      return updatedUser;
    } catch (error) {
      this.logger.error(`Updating user failed: ${error.message}`, error.stack);
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        'There was internal server error updating user ',
      );
    }
  }

  async deleteUser(userId: string, requestUser: any) {
    try {
      this.ensureSameUser(userId, requestUser);
      await this.authService.deleteUser(userId);
      return {
        success: true,
        message: 'Account successfully deleted',
      };
    } catch (error) {
      this.logger.error(`Deleting user failed: ${error.message}`, error.stack);
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        'There was an internal server error deleting user',
      );
    }
  }

  private ensureSameUser(userId: string, requestUser: Record<string, any>) {
    if (userId !== requestUser.id) {
      throw new ForbiddenException(
        'You can only access your own account information',
      );
    }
  }

  private imageFileFilter = (req, file, callback) => {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return callback(new Error('Only image files are allowed!'), false);
    }
    callback(null, true);
  };
}
