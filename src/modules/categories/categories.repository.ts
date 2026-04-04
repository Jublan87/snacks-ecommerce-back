import { Injectable } from '@nestjs/common';
import { Category } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { BaseRepository } from '../../database/repositories/base.repository';
import { CategoryFlat } from './interfaces/category-flat.interface';
import { CategoryWithChildren } from './interfaces/category-with-children.interface';
import { CategoryQueryFilters } from './interfaces/category-query-filters.interface';

@Injectable()
export class CategoriesRepository extends BaseRepository<
  Category,
  Prisma.CategoryCreateInput,
  Prisma.CategoryUpdateInput,
  Prisma.CategoryWhereInput
> {
  constructor(prisma: PrismaService) {
    super(prisma, 'category');
  }

  /**
   * Retorna categorías raíz con sus hijos directos (2 niveles).
   * Una sola query con include, sin N+1.
   */
  async findAllWithHierarchy(filters?: CategoryQueryFilters): Promise<CategoryWithChildren[]> {
    const isActiveFilter = this.buildIsActiveFilter(filters);
    const rows = await this.prisma.category.findMany({
      where: { parentId: null, ...isActiveFilter },
      include: {
        children: {
          where: isActiveFilter,
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { order: 'asc' },
    });

    return rows.map((row) => this.toCategoryWithChildren(row));
  }

  /**
   * Retorna todas las categorías como lista plana (sin relaciones).
   */
  async findAllFlat(filters?: CategoryQueryFilters): Promise<CategoryFlat[]> {
    const isActiveFilter = this.buildIsActiveFilter(filters);
    const rows = await this.prisma.category.findMany({
      where: isActiveFilter,
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
    });

    return rows.map(this.toCategoryFlat);
  }

  /**
   * Retorna una categoría por ID con sus hijos directos.
   */
  async findByIdWithChildren(id: string): Promise<CategoryWithChildren | null> {
    const row = await this.prisma.category.findUnique({
      where: { id },
      include: {
        children: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!row) return null;
    return this.toCategoryWithChildren(row);
  }

  /**
   * Retorna una categoría por slug (sin relaciones).
   */
  async findBySlug(slug: string): Promise<CategoryFlat | null> {
    const row = await this.prisma.category.findUnique({
      where: { slug },
    });

    if (!row) return null;
    return this.toCategoryFlat(row);
  }

  // ─── Helpers privados ────────────────────────────────────────────────────────

  private buildIsActiveFilter(filters?: CategoryQueryFilters): Prisma.CategoryWhereInput {
    if (filters?.includeInactive) return {};
    return { isActive: true };
  }

  private toCategoryFlat(row: Category): CategoryFlat {
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      parentId: row.parentId,
      image: row.image,
      order: row.order,
      isActive: row.isActive,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private toCategoryWithChildren(row: Category & { children: Category[] }): CategoryWithChildren {
    return {
      ...this.toCategoryFlat(row),
      children: row.children.map(this.toCategoryFlat),
    };
  }
}
