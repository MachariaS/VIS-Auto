import { IsEmail, IsString, Matches } from 'class-validator';

export class VerifyOtpDto {
  @IsEmail()
  email!: string;

  @IsString()
  @Matches(/^[A-HJ-NP-Z2-9]{6}$/i, { message: 'otp must be a 6-character alphanumeric code' })
  otp!: string;
}
