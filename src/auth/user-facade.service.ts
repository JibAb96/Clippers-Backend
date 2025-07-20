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
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreatorsService } from '../creators/creators.service';
import { RegisterCreatorDto } from './dtos/creators/register-creator.dto';
import { SignInUserDto } from './dtos/signin-user.dto';
import { UpdateCreatorDto } from './dtos/creators/update-creator.dto';
import { CreatorProfileInterface } from '../interfaces/creator-profle.interface';
import { UserResponse } from '../interfaces/user-auth-response.interface';
import { AuthResponse } from './interfaces/auth-response.interface';
import { ClippersService } from '../clippers/clippers.service';
import { RegisterClipperDto } from '../auth/dtos/clippers/register-clipper.dto';
import { ClipperInterface } from '../interfaces/clipper-profile.interface';
import { UpdateClipperDto } from './dtos/clippers/update-clipper.dto';
import { GoogleOnboardingService } from './google-onboarding.service';
import { GoogleAuthResponse } from './dtos/google-oauth.dto';
import { GoogleOAuthService } from './google-oauth.service';
import { CompleteOnboardingDto } from './dtos/google-onboarding.dto';

@Injectable()
export class UserFacadeService {
  private readonly logger = new Logger(UserFacadeService.name);

  constructor(
    private readonly authService: AuthService,
    private readonly creatorsService: CreatorsService,
    private readonly clippersService: ClippersService,
    private readonly googleOnboardingService: GoogleOnboardingService,
    private readonly googleOAuthService: GoogleOAuthService,
  ) {}

  // Google OAuth Methods
  async getGoogleAuthUrl(): Promise<string> {
    return this.googleOAuthService.generateAuthUrl();
  }

  async handleGoogleCallback(code: string): Promise<GoogleAuthResponse> {
    try {
      const tokens = await this.googleOAuthService.getTokenFromCode(code);
      return await this.googleAuth(tokens.idToken);
    } catch (error) {
      this.logger.error(
        `Google callback failed: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async initiateGoogleOnboarding(userData: {
    email: string;
    name: string;
    picture: string;
    role: 'creator' | 'clipper';
  }): Promise<string> {
    return this.googleOnboardingService.generateOnboardingToken(userData);
  }

  async getOnboardingStatus(token: string): Promise<{
    currentStep: number;
    totalSteps: number;
    role: string;
  }> {
    return this.googleOnboardingService.getOnboardingStatus(token);
  }

  async googleAuth(idToken: string): Promise<GoogleAuthResponse> {
    try {
      const googleUser = await this.authService.verifyGoogleToken(idToken);

      if (!googleUser.emailVerified) {
        throw new BadRequestException('Google email is not verified');
      }

      const existingUser = await this.authService.checkUserExists(
        googleUser.email,
      );

      if (existingUser) {
        try {
          // Try to get user profile
          const userProfile = await this.authService.getUserProfile(
            existingUser.id,
          );

          // If profile exists, sign them in
          const sessionData =
            await this.authService.createSupabaseSession(idToken);

          return {
            requiresOnboarding: false,
            user: {
              id: existingUser.id,
              email: existingUser.email!,
              role: userProfile.role,
              profile: userProfile.profile,
            },
            token: sessionData.session?.access_token,
            refreshToken: sessionData.session?.refresh_token,
          };
        } catch (profileError) {
          // User exists in auth but no profile - send to onboarding
          this.logger.warn(
            `User ${existingUser.email} exists in auth but has no profile. Sending to onboarding.`,
          );

          return {
            requiresOnboarding: true,
            onboardingToken:
              this.googleOnboardingService.generateOnboardingToken({
                email: googleUser.email,
                name: googleUser.name,
                picture: googleUser.picture,
                role: 'creator', // Default role
              }),
          };
        }
      }

      // New user - send to onboarding
      return {
        requiresOnboarding: true,
        onboardingToken: this.googleOnboardingService.generateOnboardingToken({
          email: googleUser.email,
          name: googleUser.name,
          picture: googleUser.picture,
          role: 'creator',
        }),
      };
    } catch (error) {
      this.logger.error(
        `Google authentication failed: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  // Google Onboarding Methods
  async completeOnboarding(dto: CompleteOnboardingDto): Promise<UserResponse> {
    return this.googleOnboardingService.completeOnboarding(dto);
  }

  // Regular Registration Methods
  async registerCreator(form: RegisterCreatorDto): Promise<UserResponse> {
    let authData: AuthResponse | null = null;
    let profileCreated = false;
    try {
      authData = await this.authService.register({
        email: form.email,
        password: form.password,
      });
      if (!authData?.id) {
        this.logger.error('Auth registration failed to return a user ID');
        throw new InternalServerErrorException(
          'There was an internal server error',
        );
      }

      const { password, ...user } = form;
      const userProfile = await this.creatorsService.create({
        id: authData.id,
        ...user,
        brandProfilePicture: null,
      });
      profileCreated = true;

      return {
        user: userProfile,
        role: 'creator',
        token: authData.token,
        refreshToken: authData.refreshToken,
      };
    } catch (error) {
      // Rollback if user was created in auth but not in profile
      if (authData?.id && !profileCreated) {
        try {
          await this.authService.deleteUser(authData.id);
          this.logger.warn(
            `Rolled back auth user ${authData.id} after failed registration`,
          );
        } catch (rollbackError) {
          this.logger.error(
            `Rollback failed: ${rollbackError.message}`,
            rollbackError.stack,
          );
          throw new InternalServerErrorException(
            'Registration failed and rollback also failed',
          );
        }
      }

      if (error instanceof ConflictException) throw error;
      if (error instanceof BadRequestException) throw error;
      if (error.message?.includes('duplicate key')) {
        throw new ConflictException('User with this email already exists');
      }
      this.logger.error(`Registration failed: ${error.message}`, error.stack);
      throw error instanceof HttpException
        ? error
        : new InternalServerErrorException(
            'Registration failed due to an internal error',
          );
    }
  }

  async registerClipper(form: RegisterClipperDto): Promise<UserResponse> {
    let authData: AuthResponse | null = null;
    let profileCreated = false;
    try {
      authData = await this.authService.register({
        email: form.email,
        password: form.password,
      });
      if (!authData?.id) {
        this.logger.error('Auth registration failed to return a user ID');
        throw new InternalServerErrorException(
          'There was an internal server error',
        );
      }

      const { password, ...fields } = form;
      const clipperProfile = await this.clippersService.create({
        id: authData.id,
        brandProfilePicture: null,
        ...fields,
      });
      profileCreated = true;

      return {
        user: clipperProfile,
        role: 'clipper',
        token: authData.token,
        refreshToken: authData.refreshToken,
      };
    } catch (error) {
      if (authData?.id && !profileCreated) {
        try {
          await this.authService.deleteUser(authData.id);
          this.logger.warn(
            `Rolled back auth clipper ${authData.id} after failed registration`,
          );
        } catch (rollbackError) {
          this.logger.error(
            `Rollback failed: ${rollbackError.message}`,
            rollbackError.stack,
          );
          throw new InternalServerErrorException(
            'Clipper registration failed and rollback also failed',
          );
        }
      }

      if (error instanceof ConflictException) throw error;
      if (error instanceof BadRequestException) throw error;
      if (error.message?.includes('duplicate key')) {
        throw new ConflictException('Clipper with this email already exists');
      }
      this.logger.error(
        `Clipper registration failed: ${error.message}`,
        error.stack,
      );
      throw error instanceof HttpException
        ? error
        : new InternalServerErrorException(
            'Clipper registration failed due to an internal error',
          );
    }
  }

  async authenticateCreator(credentials: SignInUserDto): Promise<UserResponse> {
    const authData: AuthResponse = await this.authenticateUser(credentials);
    let creatorProfile: CreatorProfileInterface | null = null;
    try {
      if (authData.id) {
        creatorProfile = await this.creatorsService.findOneById(authData.id);
        if (!creatorProfile) {
          throw new NotFoundException(
            'Authentication succeeded but profile not found',
          );
        }
      }
      return {
        user: creatorProfile,
        role: 'creator',
        token: authData.token,
        refreshToken: authData.refreshToken,
      };
    } catch (error) {
      this.logger.error(`Login failed: ${error.message}`, error.stack);
      if (error instanceof NotFoundException) throw error;
      if (error.message === 'Invalid login credentials') {
        throw new UnauthorizedException('Invalid login credentials');
      }
      throw new InternalServerErrorException(
        'There was an internal server error during login process.',
      );
    }
  }

  async authenticateClipper(credentials: SignInUserDto): Promise<UserResponse> {
    const authData: AuthResponse = await this.authenticateUser(credentials);
    let clipperProfile: ClipperInterface | null = null;
    try {
      if (authData.id) {
        try {
          clipperProfile = await this.clippersService.findOneById(authData.id);
        } catch (error) {
          this.logger.error(
            `User logged in but cannot be found in clipper table: ${error.message}`,
            error.stack,
          );
          throw new BadRequestException(
            'User logged as with incorrect role (as clipper)',
          );
        }
      }
      return {
        user: clipperProfile,
        role: 'clipper',
        token: authData.token,
        refreshToken: authData.refreshToken,
      };
    } catch (error) {
      this.logger.error(`Signin failed: ${error.message}`, error.stack);
      if (error instanceof NotFoundException) throw error;
      if (error.message === 'Invalid login credentials') {
        throw new UnauthorizedException('Invalid login credentials');
      }
      throw new InternalServerErrorException(
        'There was an internal server error during login process.',
      );
    }
  }

  async getCreatorProfile(
    userId: string,
  ): Promise<CreatorProfileInterface | null> {
    const profile = await this.creatorsService.findOneById(userId);
    return profile;
  }

  async getClipperProfile(userId: string): Promise<ClipperInterface | null> {
    const profile = await this.clippersService.findOneById(userId);
    return profile;
  }

  async updateUserProfile(
    form: UpdateCreatorDto,
    userId: string,
  ): Promise<CreatorProfileInterface> {
    try {
      return await this.creatorsService.update(userId, form);
    } catch (error) {
      this.logger.error(`Updating user failed: ${error.message}`, error.stack);
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      )
        throw error;
      throw new InternalServerErrorException(
        'There was an internal server error updating user',
      );
    }
  }

  async updateClipperProfile(
    userId: string,
    form: UpdateClipperDto,
  ): Promise<ClipperInterface> {
    try {
      return await this.clippersService.update(userId, form);
    } catch (error) {
      this.logger.error(
        `Updating clipper profile failed: ${error.message}`,
        error.stack,
      );
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      )
        throw error;
      throw new InternalServerErrorException(
        'There was an internal server error updating clipper profile',
      );
    }
  }

  async uploadCreatorImage(
    image: Express.Multer.File,
    userId: string,
    userToken?: string,
  ): Promise<string | null> {
    const creator = await this.creatorsService.findOneById(userId);
    if (!creator) {
      throw new NotFoundException('Creator not found');
    }
    let imageUrl: string | null = null;
    try {
      imageUrl = await this.creatorsService.uploadProfilePicture(image, userId, userToken);
      try {
        await this.creatorsService.update(userId, {
          brandProfilePicture: imageUrl,
        });
      } catch (error) {
        this.logger.error(
          `Updating the creator profile table failed: ${error.message}`,
          error.stack,
        );
        throw error;
      }
    } catch (error) {
      this.logger.error(
        `Image upload or update failed: ${error.message}`,
        error.stack,
      );
      if (error instanceof NotFoundException) throw error;
      throw error;
    }
    return 'image uploaded successfully';
  }

  async uploadClipperImage(
    image: Express.Multer.File,
    userId: string,
    userToken?: string,
  ): Promise<string | null> {
    let imageUrl: string | null = null;
    try {
      const response = await this.clippersService.uploadProfilePicture(
        image,
        userId,
        userToken,
      );
      imageUrl = response?.url || null;
      try {
        await this.clippersService.update(userId, {
          brandProfilePicture: imageUrl,
        });
      } catch (error) {
        this.logger.error(
          `Updating the clipper profile table failed: ${error.message}`,
          error.stack,
        );
        throw error;
      }
    } catch (error) {
      this.logger.error(
        `Image upload or update failed: ${error.message}`,
        error.stack,
      );
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        'There was an internal server error uploading or updating the image',
      );
    }
    return imageUrl;
  }

  async deleteUser(userId: string) {
    try {
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
      )
        throw error;
      throw new InternalServerErrorException(
        'There was an internal server error deleting user',
      );
    }
  }

  async deleteProfileImage(
    userId: string,
  ): Promise<{ success: boolean; message: string }> {
    // Get the current profile to restore if needed
    const profile = await this.creatorsService.findOneById(userId);
    const previousProfilePic = profile?.brandProfilePicture ?? null;

    try {
      // Set the brandProfilePicture column to null
      await this.creatorsService.update(userId, { brandProfilePicture: null });

      try {
        // Delete the image from the bucket
        await this.creatorsService.deleteImage(userId);
      } catch (bucketError) {
        // Rollback the DB update if bucket deletion fails
        await this.creatorsService.update(userId, {
          brandProfilePicture: previousProfilePic,
        });
        this.logger.error(
          `Deleting profile image from bucket failed: ${bucketError.message}`,
          bucketError.stack,
        );
        throw new InternalServerErrorException(
          'There was an internal server error deleting the profile image from storage. Changes have been rolled back.',
        );
      }

      return {
        success: true,
        message: 'Profile image deleted successfully',
      };
    } catch (error) {
      this.logger.error(
        `Deleting profile image failed: ${error.message}`,
        error.stack,
      );
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      )
        throw error;
      throw new InternalServerErrorException(
        'There was an internal server error deleting the profile image',
      );
    }
  }

  async changePassword(
    newPassword: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      await this.authService.changePassword(newPassword);
      return {
        success: true,
        message: 'Password changed successfully',
      };
    } catch (error) {
      this.logger.error(
        `Changing password failed in facade: ${error.message}`,
        error.stack,
      );
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        'There was an internal server error changing the password',
      );
    }
  }

  private async authenticateUser(credentials: SignInUserDto) {
    try {
      return await this.authService.signin({
        email: credentials.email,
        password: credentials.password,
      });
    } catch (error) {
      this.logger.error(`Signin failed: ${error.message}`, error.stack);
      if (error instanceof NotFoundException) throw error;
      if (error.message?.includes('Database error')) {
        throw new InternalServerErrorException(
          'Authentication service unavailable',
        );
      }
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }
  }
}
