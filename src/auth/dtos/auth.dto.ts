import { IsEmail, IsNotEmpty, IsString, Matches, MinLength } from "class-validator";

export class AuthDto {
      @IsEmail()
      @IsNotEmpty()
      email: string;
    
      @IsString()
      @IsNotEmpty()
      @MinLength(8, { message: 'Password must be at least 8 characters long' })
      @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, {
        message:
          'Password must contain at least one uppercase letter, one lowercase letter, and one number',
      })
      password: string;
}