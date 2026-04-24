import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'crypto';
import { Repository } from 'typeorm';
import { MailService } from '../mail/mail.service';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { OtpChallengeEntity } from './otp-challenge.entity';
import { PasswordResetEntity } from './password-reset.entity';
import { RegisterDto } from './dto/register.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
    @InjectRepository(OtpChallengeEntity)
    private readonly otpChallengesRepository: Repository<OtpChallengeEntity>,
    @InjectRepository(PasswordResetEntity)
    private readonly passwordResetsRepository: Repository<PasswordResetEntity>,
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
      this.otpChallengesRepository.create({ email, code, expiresAt, attempts: 0 }),
    );

    await this.mailService.sendOtp(email, code);

    return {
      message: 'OTP generated for verification.',
      otpRequired: true,
      expiresAt: new Date(expiresAt).toISOString(),
      devOtp: this.configService.get('NODE_ENV') === 'production' ? undefined : code,
    };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const email = dto.email.trim().toLowerCase();
    const otp = dto.otp.trim().toUpperCase();
    const challenge = await this.otpChallengesRepository.findOneBy({ email });

    if (!challenge || challenge.expiresAt < Date.now()) {
      throw new UnauthorizedException('Invalid or expired OTP.');
    }

    if (challenge.attempts >= 5) {
      await this.otpChallengesRepository.delete({ email });
      throw new UnauthorizedException('Too many incorrect attempts. Please log in again.');
    }

    if (challenge.code !== otp) {
      await this.otpChallengesRepository.save({ ...challenge, attempts: challenge.attempts + 1 });
      const remaining = 5 - (challenge.attempts + 1);
      throw new UnauthorizedException(
        remaining > 0 ? `Incorrect code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.` : 'Too many incorrect attempts. Please log in again.',
      );
    }

    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('User not found.');
    }

    await this.otpChallengesRepository.delete({ email });

    const accessPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      accountType: user.accountType,
    };

    const refreshPayload = { sub: user.id, type: 'refresh' };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessPayload),
      this.jwtService.signAsync(refreshPayload, {
        secret: this.configService.getOrThrow<string>('REFRESH_TOKEN_SECRET'),
        expiresIn: '7d',
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      user: this.usersService.toSafeUser(user),
    };
  }

  async refresh(refreshToken: string | undefined) {
    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token.');
    }

    let payload: { sub: string; type: string };

    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.getOrThrow<string>('REFRESH_TOKEN_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token.');
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid token type.');
    }

    const user = await this.usersService.findById(payload.sub);

    if (!user) {
      throw new UnauthorizedException('User not found.');
    }

    const accessPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      accountType: user.accountType,
    };

    return {
      accessToken: await this.jwtService.signAsync(accessPayload),
      user: this.usersService.toSafeUser(user),
    };
  }

  async resendOtp(email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.usersService.findByEmail(normalizedEmail);

    if (user) {
      const code = this.generateOtp();
      const expiresAt = Date.now() + 5 * 60 * 1000;

      await this.otpChallengesRepository.save(
        this.otpChallengesRepository.create({
          email: normalizedEmail,
          code,
          expiresAt,
          attempts: 0,
        }),
      );

      await this.mailService.sendOtp(normalizedEmail, code);

      return {
        message: 'A new code has been sent.',
        otpRequired: true,
        expiresAt: new Date(expiresAt).toISOString(),
        devOtp: this.configService.get('NODE_ENV') === 'production' ? undefined : code,
      };
    }

    return { message: 'If that email has an account, a new code has been sent.', otpRequired: true };
  }

  async forgotPassword(email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.usersService.findByEmail(normalizedEmail);

    if (user) {
      const token = randomBytes(32).toString('hex');
      const expiresAt = Date.now() + 60 * 60 * 1000;

      await this.passwordResetsRepository.delete({ email: normalizedEmail });
      await this.passwordResetsRepository.save(
        this.passwordResetsRepository.create({ email: normalizedEmail, token, expiresAt }),
      );

      const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
      const resetLink = `${frontendUrl}?reset=${token}`;
      await this.mailService.sendPasswordReset(normalizedEmail, resetLink);
    }

    return { message: 'If that email has an account, a reset link has been sent.' };
  }

  async resetPassword(token: string, newPassword: string) {
    const record = await this.passwordResetsRepository.findOneBy({ token });

    if (!record || record.used || record.expiresAt < Date.now()) {
      throw new UnauthorizedException('Invalid or expired reset link.');
    }

    const user = await this.usersService.findByEmail(record.email);

    if (!user) {
      throw new UnauthorizedException('User not found.');
    }

    await this.usersService.setPassword(user.id, newPassword);

    record.used = true;
    await this.passwordResetsRepository.save(record);

    return { message: 'Password updated successfully.' };
  }

  private generateOtp(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  }
}
