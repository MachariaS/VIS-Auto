import { IsEmail, IsObject, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateMyProfileDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsString()
  @MinLength(3)
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsObject()
  profile!: Record<string, unknown>;
}
