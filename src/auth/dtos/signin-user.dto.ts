import {
  IsEmail,
  IsString,
  MinLength,
  Matches,
  MaxLength,
} from 'class-validator';


export class SignInUserDto {

  @IsEmail({}, { message: 'Invalid email address' })
  @MaxLength(100)
  @MinLength(2)
  @MaxLength(50)
  email: string;

  @IsString()
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/, {
    message:
      'Password must contain at least one letter, one number, and be at least 8 characters long',
  })
  password: string;

}
