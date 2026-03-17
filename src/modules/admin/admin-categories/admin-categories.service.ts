import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CategoryFlat } from '../../categories/interfaces/category-flat.interface';
import { ERROR_CODES } from '../../../common/constants/error-codes';
import { SlugService } from '../shared/slug.service';
import { AdminCategoriesRepository } from './admin-categories.repository';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class AdminCategoriesService {
  constructor(
    private readonly repo: AdminCategoriesRepository,
    private readonly prisma: PrismaService,
    private readonly slugService: SlugService,
  ) {}

  /**
   * Crea una nueva categoría.
   */
  async create(dto: CreateCategoryDto): Promise<CategoryFlat> {
    // 1. Validar categoría padre si se provee
    if (dto.parentId) {
      const parentExists = await this.repo.findByIdFlat(dto.parentId);
      if (!parentExists) {
        throw new NotFoundException({
          code: ERROR_CODES.CATEGORY_NOT_FOUND,
          message: `Categoría padre con id ${dto.parentId} no encontrada`,
        });
      }
    }

    // 2. Generar slug
    const slug = dto.slug ?? (await this.slugService.generateUniqueCategorySlug(dto.name));

    // 3. Crear categoría
    const created = await this.prisma.category.create({
      data: {
        name: dto.name,
        slug,
        description: dto.description ?? null,
        parentId: dto.parentId ?? null,
        image: dto.image ?? null,
        order: dto.order ?? 0,
        isActive: dto.isActive ?? true,
      },
    });

    return {
      id: created.id,
      name: created.name,
      slug: created.slug,
      description: created.description,
      parentId: created.parentId,
      image: created.image,
      order: created.order,
      isActive: created.isActive,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    };
  }

  /**
   * Actualiza una categoría existente.
   */
  async update(id: string, dto: UpdateCategoryDto): Promise<CategoryFlat> {
    const existing = await this.repo.findByIdFlat(id);
    if (!existing) {
      throw new NotFoundException({
        code: ERROR_CODES.NOT_FOUND,
        message: `Categoría con id ${id} no encontrada`,
      });
    }

    if (dto.parentId !== undefined) {
      await this.validateParentId(id, dto.parentId);
    }

    const slug = await this.resolveSlug(dto, id);

    const updated = await this.prisma.category.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(slug !== undefined && { slug }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.parentId !== undefined && { parentId: dto.parentId }),
        ...(dto.image !== undefined && { image: dto.image }),
        ...(dto.order !== undefined && { order: dto.order }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });

    return {
      id: updated.id,
      name: updated.name,
      slug: updated.slug,
      description: updated.description,
      parentId: updated.parentId,
      image: updated.image,
      order: updated.order,
      isActive: updated.isActive,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  /**
   * Elimina una categoría (hard delete) si no tiene dependencias.
   */
  async hardDelete(id: string): Promise<void> {
    // 1. Verificar que existe
    const existing = await this.repo.findByIdFlat(id);
    if (!existing) {
      throw new NotFoundException({
        code: ERROR_CODES.NOT_FOUND,
        message: `Categoría con id ${id} no encontrada`,
      });
    }

    // 2. Verificar que no tiene subcategorías ni productos
    const [hasChildren, hasProducts] = await Promise.all([
      this.repo.hasChildren(id),
      this.repo.hasProducts(id),
    ]);

    if (hasChildren || hasProducts) {
      throw new ConflictException({
        code: ERROR_CODES.CATEGORY_HAS_DEPENDENCIES,
        message: 'La categoría tiene subcategorías o productos asociados y no puede eliminarse',
      });
    }

    // 3. Eliminar
    await this.prisma.category.delete({ where: { id } });
  }

  // ─── Helpers privados ────────────────────────────────────────────────────────

  private async validateParentId(categoryId: string, parentId: string | null): Promise<void> {
    if (parentId === categoryId) {
      throw new BadRequestException({
        code: ERROR_CODES.INVALID_PARENT_CATEGORY,
        message: 'Una categoría no puede ser su propio padre',
      });
    }

    if (parentId === null) return;

    const parentExists = await this.repo.findByIdFlat(parentId);
    if (!parentExists) {
      throw new NotFoundException({
        code: ERROR_CODES.CATEGORY_NOT_FOUND,
        message: `Categoría padre con id ${parentId} no encontrada`,
      });
    }

    const hasCycle = await this.repo.wouldCreateCycle(categoryId, parentId);
    if (hasCycle) {
      throw new BadRequestException({
        code: ERROR_CODES.INVALID_PARENT_CATEGORY,
        message: 'Asignar este padre crearía un ciclo en la jerarquía de categorías',
      });
    }
  }

  private async resolveSlug(
    dto: UpdateCategoryDto,
    categoryId: string,
  ): Promise<string | undefined> {
    if (dto.slug !== undefined) return dto.slug;
    if (dto.name !== undefined) {
      return this.slugService.generateUniqueCategorySlug(dto.name, categoryId);
    }
    return undefined;
  }
}
