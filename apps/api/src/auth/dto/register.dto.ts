import { IsEmail, IsIn, IsOptional, IsString, Matches, MinLength } from 'class-validator';

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

  @IsIn(['car_owner', 'provider'])
  accountType!: 'car_owner' | 'provider';

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d])/, {
    message: 'password must contain uppercase, lowercase, number, and special character',
  })
  password!: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  businessName?: string;
}
