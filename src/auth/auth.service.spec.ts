import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { AuthDto } from './dtos/auth.dto';
import { AuthRepository } from './auth.repository';
import { AuthResponse } from './interfaces/auth-response.interface';

describe('AuthService', () => {
  let service: AuthService;
  let fakeAuthRepository: Partial<AuthRepository>;

  beforeEach(async () => {
    const creators: AuthDto[] = [];
    fakeAuthRepository = {
      register: (email: string, password: string) => {
        const creator = {
          email,
          password,
        } as AuthDto;
        creators.push(creator);
        return Promise.resolve({
          id: 'someId',
          token: 'generatedToken',
          refreshToken: 'generatedRefreshToken',
        }) as Promise<AuthResponse>;
      },
      login: (email: string, password: string) => {
        const creator = {
          email,
          password,
        } as AuthDto;
        const filteredCreators = creators.filter(
          (user) => creator.email === user.email,
        );
        if (filteredCreators.length === 0) {
          return Promise.reject(new Error('User not found'));
        }
        return Promise.resolve({
          id: 'someId',
          token: 'generatedToken',
          refreshToken: 'generatedRefreshToken',
        }) as Promise<AuthResponse>;
      },
      deleteUser: (id: string) => {
        return Promise.resolve();
      },
    };
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: AuthRepository,
          useValue: fakeAuthRepository,
        },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

 
  describe('register', () => {
    it('should register a new user successfully', async () => {
      const authDto: AuthDto = {
        email: 'test@example.com',
        password: 'password123',
      };
      const expectedResponse: AuthResponse = {
        id: 'someId',
        token: 'generatedToken',
        refreshToken: 'generatedRefreshToken',
      };

      const result = await service.register(authDto);

      expect(result).toEqual(expectedResponse);
    });

    it('should pass the correct parameters to the repository', async () => {
      const authDto: AuthDto = {
        email: 'test@example.com',
        password: 'password123',
      };
      const registerSpy = jest.spyOn(fakeAuthRepository, 'register');

    
      await service.register(authDto);

      expect(registerSpy).toHaveBeenCalledWith(authDto.email, authDto.password);
    });

    it('should propagate errors from the repository', async () => {
      const authDto: AuthDto = {
        email: 'test@example.com',
        password: 'password123',
      };
      const expectedError = new Error('Registration failed');
      jest
        .spyOn(fakeAuthRepository, 'register')
        .mockRejectedValueOnce(expectedError);

      await expect(service.register(authDto)).rejects.toThrow(expectedError);
    });
  });

  describe('signin', () => {
    it('should sign in a registered user successfully', async () => {
      const authDto: AuthDto = {
        email: 'test@example.com',
        password: 'password123',
      };
      await service.register(authDto);

      const expectedResponse: AuthResponse = {
        id: 'someId',
        token: 'generatedToken',
        refreshToken: 'generatedRefreshToken',
      };

      const result = await service.signin(authDto);

      expect(result).toEqual(expectedResponse);
    });

    it('should pass the correct parameters to the repository', async () => {
      const authDto: AuthDto = {
        email: 'test@example.com',
        password: 'password123',
      };
      await service.register(authDto);

      const loginSpy = jest.spyOn(fakeAuthRepository, 'login');

      await service.signin(authDto);

      expect(loginSpy).toHaveBeenCalledWith(authDto.email, authDto.password);
    });

    it('should throw an error when signing in a non-existent user', async () => {
      const authDto: AuthDto = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      await expect(service.signin(authDto)).rejects.toThrow('User not found');
    });

    it('should propagate errors from the repository', async () => {
      const authDto: AuthDto = {
        email: 'test@example.com',
        password: 'password123',
      };
      await service.register(authDto); 

      const expectedError = new Error('Login failed');
      jest
        .spyOn(fakeAuthRepository, 'login')
        .mockRejectedValueOnce(expectedError);

      await expect(service.signin(authDto)).rejects.toThrow(expectedError);
    });
  });

  describe('deleteUser', () => {
    it('should call repository.deleteUser with the correct ID', async () => {
      const userId = 'user-123';
      const deleteUserSpy = jest.spyOn(fakeAuthRepository, 'deleteUser');

      await service.deleteUser(userId);

      expect(deleteUserSpy).toHaveBeenCalledWith(userId);
    });
  });
});
