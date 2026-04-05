import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { UserWithoutPassword } from '../../users/interfaces/user-without-password.interface';
import { ERROR_CODES } from '../../../common/constants/error-codes';
import {
  buildPaginatedResponse,
  calculatePaginationMeta,
  PaginationMeta,
} from '../../../common/utils/pagination.util';
import { AdminUsersRepository } from './admin-users.repository';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';

@Injectable()
export class AdminUsersService {
  private readonly logger = new Logger(AdminUsersService.name);

  constructor(private readonly repo: AdminUsersRepository) {}

  /**
   * Lista usuarios paginados con filtros opcionales de rol y búsqueda.
   */
  async findAll(
    query: ListUsersQueryDto,
  ): Promise<{ items: UserWithoutPassword[]; meta: PaginationMeta }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const { users, total } = await this.repo.findManyWithFilters({
      page,
      limit,
      role: query.role,
      search: query.search,
    });

    const meta = calculatePaginationMeta(total, page, limit);
    return buildPaginatedResponse(users, meta);
  }

  /**
   * Cambia el rol de un usuario.
   * Lanza BadRequestException si el admin intenta cambiar su propio rol.
   */
  async updateRole(
    id: string,
    dto: UpdateUserRoleDto,
    currentUserId: string,
  ): Promise<UserWithoutPassword> {
    if (id === currentUserId) {
      throw new BadRequestException({
        code: ERROR_CODES.CANNOT_CHANGE_OWN_ROLE,
        message: 'No podés cambiar tu propio rol',
      });
    }

    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new NotFoundException({
        code: ERROR_CODES.NOT_FOUND,
        message: `Usuario con id ${id} no encontrado`,
      });
    }

    return this.repo.updateRole(id, dto.role);
  }
}
