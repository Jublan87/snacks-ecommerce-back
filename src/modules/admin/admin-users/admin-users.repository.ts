import { Injectable } from '@nestjs/common';
import { User, UserRole } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { BaseRepository } from '../../../database/repositories/base.repository';
import { UserWithoutPassword } from '../../users/interfaces/user-without-password.interface';
import { USER_SELECT_NO_PASSWORD } from '../../users/users.repository';
import { ListUsersQuery } from './interfaces/list-users-query.interface';

@Injectable()
export class AdminUsersRepository extends BaseRepository<
  User,
  Prisma.UserCreateInput,
  Prisma.UserUpdateInput,
  Prisma.UserWhereInput
> {
  constructor(prisma: PrismaService) {
    super(prisma, 'user');
  }

  /**
   * Lista usuarios paginados con filtros opcionales de rol y búsqueda.
   * Retorna los registros y el total para calcular la paginación.
   */
  async findManyWithFilters(query: ListUsersQuery): Promise<{
    users: UserWithoutPassword[];
    total: number;
  }> {
    const { page, limit, role, search } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {};

    if (role) {
      where.role = role === 'admin' ? UserRole.admin : UserRole.customer;
    }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: USER_SELECT_NO_PASSWORD,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { users: users as UserWithoutPassword[], total };
  }

  /**
   * Cambia el rol de un usuario y retorna el registro actualizado sin password.
   */
  async updateRole(id: string, role: 'customer' | 'admin'): Promise<UserWithoutPassword> {
    const user = await this.prisma.user.update({
      where: { id },
      data: { role: role === 'admin' ? UserRole.admin : UserRole.customer },
      select: USER_SELECT_NO_PASSWORD,
    });
    return user as UserWithoutPassword;
  }
}
