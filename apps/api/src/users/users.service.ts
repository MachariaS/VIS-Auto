import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { compare, hash } from 'bcrypt';
import { randomUUID } from 'crypto';
import { User } from './user.types';

interface CreateUserInput {
  email: string;
  name: string;
  password: string;
}

@Injectable()
export class UsersService {
  private readonly users = new Map<string, User>();

  async create(input: CreateUserInput) {
    const email = input.email.trim().toLowerCase();
    const existing = this.users.get(email);

    if (existing) {
      throw new ConflictException('A user with that email already exists.');
    }

    const user: User = {
      id: randomUUID(),
      email,
      name: input.name.trim(),
      passwordHash: await hash(input.password, 10),
      createdAt: new Date().toISOString(),
    };

    this.users.set(email, user);

    return this.toSafeUser(user);
  }

  async validateCredentials(email: string, password: string) {
    const user = this.users.get(email.trim().toLowerCase());

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const isValid = await compare(password, user.passwordHash);

    if (!isValid) {
      return null;
    }

    return user;
  }

  findByEmail(email: string) {
    return this.users.get(email.trim().toLowerCase()) ?? null;
  }

  toSafeUser(user: User) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
    };
  }
}
