import { Injectable } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { UserWithoutPassword } from './interfaces/user-without-password.interface';
import { UserWithPasswordForAuth } from './interfaces/user-with-password-for-auth.interface';
import { CreateUserInput } from './interfaces/create-user-input.interface';
import { UpdateUserInput } from './interfaces/update-user-input.interface';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async findByEmail(email: string): Promise<UserWithoutPassword | null> {
    return this.usersRepository.findByEmail(email, false);
  }

  async findByEmailWithPassword(email: string): Promise<UserWithPasswordForAuth | null> {
    const user = await this.usersRepository.findByEmail(email, true);
    if (!user || !('password' in user)) return null;
    return user as UserWithPasswordForAuth;
  }

  async findById(id: string): Promise<UserWithoutPassword | null> {
    return this.usersRepository.findByIdWithoutPassword(id);
  }

  async findByIdWithPassword(id: string): Promise<UserWithPasswordForAuth | null> {
    const user = await this.usersRepository.findByIdWithPassword(id);
    if (!user || !('password' in user)) return null;
    return user as UserWithPasswordForAuth;
  }

  async create(data: CreateUserInput): Promise<UserWithoutPassword> {
    return this.usersRepository.createAndReturnWithoutPassword(data);
  }

  async update(id: string, data: UpdateUserInput): Promise<UserWithoutPassword> {
    return this.usersRepository.updateAndReturnWithoutPassword(id, data);
  }

  async existsByEmail(email: string): Promise<boolean> {
    const user = await this.usersRepository.findByEmail(email, false);
    return user !== null;
  }
}
