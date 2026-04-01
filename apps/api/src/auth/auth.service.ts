import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { OtpChallengeEntity } from './otp-challenge.entity';
import { RegisterDto } from './dto/register.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(OtpChallengeEntity)
    private readonly otpChallengesRepository: Repository<OtpChallengeEntity>,
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

    await this.otpChallengesRepository.save(
      this.otpChallengesRepository.create({ email, code, expiresAt }),
    );

    return {
      message: 'OTP generated for verification.',
      otpRequired: true,
      expiresAt: new Date(expiresAt).toISOString(),
      devOtp: this.configService.get('NODE_ENV') === 'production' ? undefined : code,
    };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const email = dto.email.trim().toLowerCase();
    const challenge = await this.otpChallengesRepository.findOneBy({ email });

    if (!challenge || challenge.expiresAt < Date.now() || challenge.code !== dto.otp) {
      throw new UnauthorizedException('Invalid or expired OTP.');
    }

    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('User not found.');
    }

    await this.otpChallengesRepository.delete({ email });

    const payload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      accountType: user.accountType,
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
