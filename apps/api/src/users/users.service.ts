import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { compare, hash } from 'bcrypt';
import { In, Repository } from 'typeorm';
import { UpdateMyPasswordDto } from './dto/update-my-password.dto';
import { UpdateMyProfileDto } from './dto/update-my-profile.dto';
import { UserEntity } from './user.entity';
import { User } from './user.types';

interface CreateUserInput {
  email: string;
  name: string;
  phone?: string;
  accountType: 'customer' | 'provider';
  password: string;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
  ) {}

  async create(input: CreateUserInput) {
    const email = input.email.trim().toLowerCase();
    const existing = await this.usersRepository.findOneBy({ email });

    if (existing) {
      throw new ConflictException('A user with that email already exists.');
    }

    const user = this.usersRepository.create({
      email,
      name: input.name.trim(),
      phone: input.phone?.trim() || undefined,
      accountType: input.accountType,
      profile: undefined,
      passwordHash: await hash(input.password, 10),
    });

    const saved = await this.usersRepository.save(user);

    return this.toSafeUser(saved);
  }

  async validateCredentials(email: string, password: string) {
    const user = await this.usersRepository.findOneBy({ email: email.trim().toLowerCase() });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const isValid = await compare(password, user.passwordHash);

    if (!isValid) {
      return null;
    }

    return user;
  }

  async findByEmail(email: string) {
    return this.usersRepository.findOneBy({ email: email.trim().toLowerCase() });
  }

  async findById(userId: string) {
    return this.usersRepository.findOneBy({ id: userId });
  }

  async findByIds(userIds: string[]) {
    if (userIds.length === 0) return [];
    return this.usersRepository.findBy({ id: In(userIds) });
  }

  async getProfile(userId: string) {
    const user = await this.findRequiredUser(userId);

    return {
      user: this.toSafeUser(user),
      profile: user.profile || {},
    };
  }

  async updateProfile(userId: string, input: UpdateMyProfileDto) {
    if (JSON.stringify(input.profile).length > 50_000) {
      throw new BadRequestException('Profile data too large.');
    }

    const name = input.name.trim();
    const email = input.email.trim().toLowerCase();
    const phone = input.phone?.trim() || undefined;
    const profile = input.profile;
    const user = await this.findRequiredUser(userId);

    const existing = await this.usersRepository.findOneBy({ email });
    if (existing && existing.id !== userId) {
      throw new ConflictException('A user with that email already exists.');
    }

    user.name = name;
    user.email = email;
    user.phone = phone;
    user.profile = profile;

    const saved = await this.usersRepository.save(user);

    return {
      user: this.toSafeUser(saved),
      profile: saved.profile || {},
    };
  }

  async setPassword(userId: string, newPassword: string) {
    const user = await this.findRequiredUser(userId);
    user.passwordHash = await hash(newPassword, 10);
    await this.usersRepository.save(user);
  }

  async updatePassword(userId: string, dto: UpdateMyPasswordDto) {
    const user = await this.findRequiredUser(userId);
    const isValid = await compare(dto.currentPassword, user.passwordHash);

    if (!isValid) {
      throw new UnauthorizedException('Current password is incorrect.');
    }

    user.passwordHash = await hash(dto.newPassword, 10);
    await this.usersRepository.save(user);

    return { updated: true };
  }

  private async findRequiredUser(userId: string) {
    const user = await this.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    return user;
  }

  private requireString(value: unknown, field: string, minLength = 1) {
    if (typeof value !== 'string' || value.trim().length < minLength) {
      throw new BadRequestException(`${field} must be at least ${minLength} character(s).`);
    }

    return value.trim();
  }

  private optionalString(value: unknown) {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    if (typeof value !== 'string') {
      throw new BadRequestException('phone must be a string.');
    }

    return value.trim() || undefined;
  }

  private requireEmail(value: unknown) {
    const email = this.requireString(value, 'email', 3).toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new BadRequestException('email must be a valid email address.');
    }

    return email;
  }

  private requireObject(value: unknown, field: string) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new BadRequestException(`${field} must be an object.`);
    }

    return value as Record<string, unknown>;
  }

  toSafeUser(user: User | UserEntity) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      accountType: user.accountType,
      profile: user.profile,
      createdAt:
        user.createdAt instanceof Date ? user.createdAt.toISOString() : String(user.createdAt),
    };
  }
}
