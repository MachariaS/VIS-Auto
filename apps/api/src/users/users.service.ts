import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { compare, hash } from 'bcrypt';
import { Repository } from 'typeorm';
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

  toSafeUser(user: User | UserEntity) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      accountType: user.accountType,
      createdAt:
        user.createdAt instanceof Date ? user.createdAt.toISOString() : String(user.createdAt),
    };
  }
}
