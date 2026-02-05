import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { IBaseRepository } from './interfaces/base-repository.interface';
import { ERROR_CODES } from '../../common/constants/error-codes';

/**
 * Clase abstracta base para repositorios que implementa operaciones CRUD comunes.
 *
 * Esta clase proporciona una implementación genérica de las operaciones básicas
 * de acceso a datos usando Prisma. Los repositorios específicos deben extender
 * esta clase y proporcionar el nombre del modelo de Prisma.
 *
 * @template T - Tipo del modelo de Prisma (ej: User, Product)
 * @template CreateInput - Tipo de entrada para crear (Prisma.XCreateInput)
 * @template UpdateInput - Tipo de entrada para actualizar (Prisma.XUpdateInput)
 * @template WhereInput - Tipo de condición WHERE (Prisma.XWhereInput)
 * @template Select - Tipo de selección de campos (ej: Prisma.UserSelect). Por defecto object.
 *
 * @example
 * ```typescript
 * class UsersRepository extends BaseRepository<User, Prisma.UserCreateInput, Prisma.UserUpdateInput, Prisma.UserWhereInput> {
 *   constructor(prisma: PrismaService) {
 *     super(prisma, 'user');
 *   }
 *
 *   // Métodos específicos del repositorio
 *   async findByEmail(email: string) {
 *     return this.findOne({ email });
 *   }
 * }
 * ```
 */
export abstract class BaseRepository<
  T,
  CreateInput,
  UpdateInput,
  WhereInput,
  Select = object,
> implements IBaseRepository<T, CreateInput, UpdateInput, WhereInput, Select> {
  /**
   * @param prisma - Instancia de PrismaService para acceso a la base de datos
   * @param modelName - Nombre del modelo de Prisma (ej: 'user', 'product')
   */
  constructor(
    protected readonly prisma: PrismaService,
    protected readonly modelName: string,
  ) {}

  /**
   * Busca un registro por su ID.
   * Los errores de Prisma se propagan y son manejados por PrismaExceptionFilter.
   */
  async findById(id: string, select?: Select): Promise<T | null> {
    return (this.prisma[this.modelName] as any).findUnique({
      where: { id },
      ...(select && { select }),
    });
  }

  /**
   * Busca todos los registros que cumplan con los criterios.
   */
  async findAll(where?: WhereInput, select?: Select): Promise<T[]> {
    return (this.prisma[this.modelName] as any).findMany({
      ...(where && { where }),
      ...(select && { select }),
    });
  }

  /**
   * Busca un único registro que cumpla con los criterios.
   */
  async findOne(where: WhereInput, select?: Select): Promise<T | null> {
    return (this.prisma[this.modelName] as any).findFirst({
      where,
      ...(select && { select }),
    });
  }

  /**
   * Crea un nuevo registro.
   * Errores de Prisma (ej. P2002 unique constraint) son manejados por PrismaExceptionFilter.
   */
  async create(data: CreateInput, select?: Select): Promise<T> {
    return (this.prisma[this.modelName] as any).create({
      data,
      ...(select && { select }),
    });
  }

  /**
   * Actualiza un registro existente.
   * Lanza NotFoundException si no existe (mensaje explícito). El resto de errores de Prisma
   * (ej. P2002) los maneja PrismaExceptionFilter.
   */
  async update(id: string, data: UpdateInput, select?: Select): Promise<T> {
    const exists = await this.exists(id);
    if (!exists) {
      throw new NotFoundException({
        code: ERROR_CODES.RECORD_NOT_FOUND,
        message: `${this.modelName} con id ${id} no encontrado`,
      });
    }
    return (this.prisma[this.modelName] as any).update({
      where: { id },
      data,
      ...(select && { select }),
    });
  }

  /**
   * Elimina un registro por su ID.
   * Lanza NotFoundException si no existe. Errores de Prisma los maneja PrismaExceptionFilter.
   */
  async delete(id: string): Promise<T> {
    const exists = await this.exists(id);
    if (!exists) {
      throw new NotFoundException({
        code: ERROR_CODES.RECORD_NOT_FOUND,
        message: `${this.modelName} con id ${id} no encontrado`,
      });
    }
    return (this.prisma[this.modelName] as any).delete({
      where: { id },
    });
  }

  /**
   * Cuenta el número de registros que cumplen con los criterios.
   */
  async count(where?: WhereInput): Promise<number> {
    return (this.prisma[this.modelName] as any).count({
      ...(where && { where }),
    });
  }

  /**
   * Verifica si existe un registro con el ID dado.
   */
  async exists(id: string): Promise<boolean> {
    const count = await (this.prisma[this.modelName] as any).count({
      where: { id },
    });
    return count > 0;
  }
}
