import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

interface OtpChallenge {
  code: string;
  expiresAt: number;
}

@Injectable()
export class AuthService {
  private readonly otpChallenges = new Map<string, OtpChallenge>();

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const user = await this.usersService.create(dto);

    return {
      message: 'Registration successful.',
      user,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.validateCredentials(dto.email, dto.password);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const code = this.generateOtp();
    const expiresAt = Date.now() + 5 * 60 * 1000;
    const email = user.email.toLowerCase();
    this.otpChallenges.set(email, { code, expiresAt });

    return {
      message: 'OTP generated for verification.',
      otpRequired: true,
      expiresAt: new Date(expiresAt).toISOString(),
      devOtp: this.configService.get('NODE_ENV') === 'production' ? undefined : code,
    };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const email = dto.email.trim().toLowerCase();
    const challenge = this.otpChallenges.get(email);

    if (!challenge || challenge.expiresAt < Date.now() || challenge.code !== dto.otp) {
      throw new UnauthorizedException('Invalid or expired OTP.');
    }

    const user = this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('User not found.');
    }

    this.otpChallenges.delete(email);

    const payload = {
      sub: user.id,
      email: user.email,
      name: user.name,
    };

    return {
      accessToken: await this.jwtService.signAsync(payload),
      user: this.usersService.toSafeUser(user),
    };
  }

  private generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}
