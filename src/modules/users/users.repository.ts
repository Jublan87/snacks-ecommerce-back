import { Injectable } from '@nestjs/common';
import { User, UserRole } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { BaseRepository } from '../../database/repositories/base.repository';
import { UserWithoutPassword } from './interfaces/user-without-password.interface';
import { CreateUserInput } from './interfaces/create-user-input.interface';
import { UpdateUserInput } from './interfaces/update-user-input.interface';

export const USER_SELECT_NO_PASSWORD = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  role: true,
  addresses: { orderBy: { createdAt: 'asc' as const } },
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class UsersRepository extends BaseRepository<
  User,
  Prisma.UserCreateInput,
  Prisma.UserUpdateInput,
  Prisma.UserWhereInput
> {
  constructor(prisma: PrismaService) {
    super(prisma, 'user');
  }

  /**
   * Busca un usuario por email.
   * @param includePassword - si es true, incluye el campo password (para login)
   */
  async findByEmail(email: string, includePassword: true): Promise<User | null>;
  async findByEmail(email: string, includePassword: false): Promise<UserWithoutPassword | null>;
  async findByEmail(
    email: string,
    includePassword = false,
  ): Promise<User | UserWithoutPassword | null> {
    if (includePassword) {
      return this.prisma.user.findUnique({
        where: { email },
      });
    }
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: USER_SELECT_NO_PASSWORD,
    });
    return this.toUserWithoutPassword(user);
  }

  /**
   * Crea un usuario a partir de datos de dominio y retorna el registro sin password.
   */
  async createAndReturnWithoutPassword(data: CreateUserInput): Promise<UserWithoutPassword> {
    const prismaData: Prisma.UserCreateInput = {
      email: data.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone ?? null,
      role: data.role === 'admin' ? UserRole.admin : UserRole.customer,
    };
    const user = await this.prisma.user.create({
      data: prismaData,
      select: USER_SELECT_NO_PASSWORD,
    });
    return user as UserWithoutPassword;
  }

  /**
   * Actualiza un usuario a partir de datos de dominio y retorna el registro sin password.
   */
  async updateAndReturnWithoutPassword(
    id: string,
    data: UpdateUserInput,
  ): Promise<UserWithoutPassword> {
    const prismaData: Prisma.UserUpdateInput = {};
    if (data.firstName !== undefined) prismaData.firstName = data.firstName;
    if (data.lastName !== undefined) prismaData.lastName = data.lastName;
    if (data.phone !== undefined) prismaData.phone = data.phone;
    if (data.password !== undefined) prismaData.password = data.password;

    const user = await this.prisma.user.update({
      where: { id },
      data: prismaData,
      select: USER_SELECT_NO_PASSWORD,
    });
    return user as UserWithoutPassword;
  }

  /**
   * Busca por ID sin incluir password.
   */
  async findByIdWithoutPassword(id: string): Promise<UserWithoutPassword | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: USER_SELECT_NO_PASSWORD,
    });
    return this.toUserWithoutPassword(user);
  }

  /**
   * Busca por ID incluyendo password (para cambio de contraseña).
   */
  async findByIdWithPassword(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  private toUserWithoutPassword(row: unknown): UserWithoutPassword | null {
    if (!row) return null;
    return row as UserWithoutPassword;
  }
}
