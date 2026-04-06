import { IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  @MinLength(7)
  phone?: string;

  @IsIn(['customer', 'provider'])
  accountType!: 'customer' | 'provider';

  @IsString()
  @MinLength(8)
  password!: string;
}
