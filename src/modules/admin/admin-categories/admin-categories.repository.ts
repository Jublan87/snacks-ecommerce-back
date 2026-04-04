import { Injectable } from '@nestjs/common';
import { Category } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { BaseRepository } from '../../../database/repositories/base.repository';
import { CategoryFlat } from '../../categories/interfaces/category-flat.interface';

@Injectable()
export class AdminCategoriesRepository extends BaseRepository<
  Category,
  Prisma.CategoryCreateInput,
  Prisma.CategoryUpdateInput,
  Prisma.CategoryWhereInput
> {
  constructor(prisma: PrismaService) {
    super(prisma, 'category');
  }

  /**
   * Retorna una categoría por ID como objeto plano.
   */
  async findByIdFlat(id: string): Promise<CategoryFlat | null> {
    const row = await this.prisma.category.findUnique({ where: { id } });
    if (!row) return null;
    return this.toCategoryFlat(row);
  }

  /**
   * Verifica si la categoría tiene productos asociados.
   */
  async hasProducts(categoryId: string): Promise<boolean> {
    const count = await this.prisma.product.count({ where: { categoryId } });
    return count > 0;
  }

  /**
   * Verifica si la categoría tiene subcategorías.
   */
  async hasChildren(categoryId: string): Promise<boolean> {
    const count = await this.prisma.category.count({ where: { parentId: categoryId } });
    return count > 0;
  }

  /**
   * Verifica si asignar `proposedParentId` como padre de `categoryId` crearía un ciclo.
   * Camina hacia arriba desde `proposedParentId` hasta llegar a una raíz o detectar el ciclo.
   */
  async wouldCreateCycle(categoryId: string, proposedParentId: string): Promise<boolean> {
    const visited = new Set<string>();
    let currentId: string | null = proposedParentId;

    while (currentId !== null) {
      if (currentId === categoryId) return true;
      if (visited.has(currentId)) return true; // safety: ciclo existente en DB

      visited.add(currentId);

      const row: { parentId: string | null } | null = await this.prisma.category.findUnique({
        where: { id: currentId },
        select: { parentId: true },
      });

      currentId = row?.parentId ?? null;
    }

    return false;
  }

  // ─── Helper privado ──────────────────────────────────────────────────────────

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
}
