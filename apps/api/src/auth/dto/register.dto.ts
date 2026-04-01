import { IsEmail, IsIn, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsEmail()
  email!: string;

  @IsIn(['customer', 'provider'])
  accountType!: 'customer' | 'provider';

  @IsString()
  @MinLength(8)
  password!: string;
}
