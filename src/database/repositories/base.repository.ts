import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { IBaseRepository } from './interfaces/base-repository.interface';
import { ERROR_CODES } from '../../common/constants/error-codes';

/** Minimal shape shared by every Prisma model delegate used in BaseRepository. */
interface PrismaModelDelegate {
  findUnique(args: unknown): Promise<unknown>;
  findMany(args?: unknown): Promise<unknown[]>;
  findFirst(args?: unknown): Promise<unknown>;
  create(args: unknown): Promise<unknown>;
  update(args: unknown): Promise<unknown>;
  delete(args: unknown): Promise<unknown>;
  count(args?: unknown): Promise<number>;
}

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

  /** Returns the Prisma delegate for `modelName` with a single, contained type cast. */
  private get delegate(): PrismaModelDelegate {
    return (this.prisma as unknown as Record<string, PrismaModelDelegate>)[this.modelName];
  }

  /**
   * Busca un registro por su ID.
   * Los errores de Prisma se propagan y son manejados por PrismaExceptionFilter.
   */
  async findById(id: string, select?: Select): Promise<T | null> {
    return this.delegate.findUnique({
      where: { id },
      ...(select && { select }),
    }) as Promise<T | null>;
  }

  /**
   * Busca todos los registros que cumplan con los criterios.
   */
  async findAll(where?: WhereInput, select?: Select): Promise<T[]> {
    return this.delegate.findMany({
      ...(where && { where }),
      ...(select && { select }),
    }) as Promise<T[]>;
  }

  /**
   * Busca un único registro que cumpla con los criterios.
   */
  async findOne(where: WhereInput, select?: Select): Promise<T | null> {
    return this.delegate.findFirst({
      where,
      ...(select && { select }),
    }) as Promise<T | null>;
  }

  /**
   * Crea un nuevo registro.
   * Errores de Prisma (ej. P2002 unique constraint) son manejados por PrismaExceptionFilter.
   */
  async create(data: CreateInput, select?: Select): Promise<T> {
    return this.delegate.create({
      data,
      ...(select && { select }),
    }) as Promise<T>;
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
    return this.delegate.update({
      where: { id },
      data,
      ...(select && { select }),
    }) as Promise<T>;
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
    return this.delegate.delete({
      where: { id },
    }) as Promise<T>;
  }

  /**
   * Cuenta el número de registros que cumplen con los criterios.
   */
  async count(where?: WhereInput): Promise<number> {
    return this.delegate.count({
      ...(where && { where }),
    });
  }

  /**
   * Verifica si existe un registro con el ID dado.
   */
  async exists(id: string): Promise<boolean> {
    const count = await this.delegate.count({
      where: { id },
    });
    return count > 0;
  }
}
