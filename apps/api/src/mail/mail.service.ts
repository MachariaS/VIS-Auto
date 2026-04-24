import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly transporter: nodemailer.Transporter | null;
  private readonly fromAddress: string;
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST');
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    this.fromAddress = this.configService.get<string>('MAIL_FROM', 'VIS Auto <noreply@vis-auto.com>');

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port: Number(this.configService.get('SMTP_PORT', '587')),
        secure: false,
        auth: { user, pass },
      });
    } else {
      this.transporter = null;
      this.logger.warn('SMTP not configured — OTP will only appear in dev mode');
    }
  }

  async sendOtp(email: string, code: string): Promise<void> {
    if (!this.transporter) {
      this.logger.debug(`[DEV] OTP for ${email}: ${code}`);
      return;
    }

    try {
      await this.transporter.sendMail({
        from: this.fromAddress,
        to: email,
        subject: 'Your VIS Auto login code',
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
            <h2 style="font-size:20px;color:#1f2f25;margin:0 0 8px">Your login code</h2>
            <p style="color:#5b6c62;margin:0 0 24px">
              Enter this code to sign in to VIS Auto. It expires in 5 minutes.
            </p>
            <div style="background:#f6f8f6;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
              <span style="font-size:40px;font-weight:700;letter-spacing:14px;color:#1f2f25;font-family:monospace">
                ${code}
              </span>
            </div>
            <p style="color:#8a9a90;font-size:13px;margin:0">
              If you didn't request this, you can safely ignore this email.
            </p>
          </div>
        `,
      });
    } catch (error) {
      this.logger.error(`Failed to send OTP to ${email}`, error);
    }
  }

  async sendPasswordReset(email: string, resetLink: string): Promise<void> {
    if (!this.transporter) {
      this.logger.debug(`[DEV] Password reset link for ${email}: ${resetLink}`);
      return;
    }

    try {
      await this.transporter.sendMail({
        from: this.fromAddress,
        to: email,
        subject: 'Reset your VIS Auto password',
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
            <h2 style="font-size:20px;color:#1f2f25;margin:0 0 8px">Reset your password</h2>
            <p style="color:#5b6c62;margin:0 0 24px">
              Click the button below to set a new password. This link expires in 1 hour.
            </p>
            <a href="${resetLink}"
               style="display:block;background:#4a7c59;color:#fff;text-align:center;padding:14px 24px;border-radius:12px;text-decoration:none;font-weight:600;margin-bottom:24px">
              Reset password
            </a>
            <p style="color:#8a9a90;font-size:13px;margin:0">
              If you didn't request a password reset, you can safely ignore this email.
            </p>
          </div>
        `,
      });
    } catch (error) {
      this.logger.error(`Failed to send password reset to ${email}`, error);
    }
  }
}
