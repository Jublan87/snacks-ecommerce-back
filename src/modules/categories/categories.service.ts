import { Injectable, NotFoundException } from '@nestjs/common';
import { CategoriesRepository } from './categories.repository';
import { CategoryFlat } from './interfaces/category-flat.interface';
import { CategoryWithChildren } from './interfaces/category-with-children.interface';
import { CategoryQueryFilters } from './interfaces/category-query-filters.interface';
import { ERROR_CODES } from '../../common/constants/error-codes';

@Injectable()
export class CategoriesService {
  constructor(private readonly categoriesRepository: CategoriesRepository) {}

  /**
   * Retorna categorías en estructura jerárquica (raíces con sus hijos).
   */
  async findAll(filters?: CategoryQueryFilters): Promise<CategoryWithChildren[]> {
    return this.categoriesRepository.findAllWithHierarchy(filters);
  }

  /**
   * Retorna todas las categorías como lista plana.
   */
  async findAllFlat(filters?: CategoryQueryFilters): Promise<CategoryFlat[]> {
    return this.categoriesRepository.findAllFlat(filters);
  }

  /**
   * Retorna una categoría por ID con sus hijos directos.
   * Lanza NotFoundException si no existe o está inactiva (a menos que sea admin).
   */
  async findById(id: string, isAdmin = false): Promise<CategoryWithChildren> {
    const category = await this.categoriesRepository.findByIdWithChildren(id);
    if (!category || (!category.isActive && !isAdmin)) {
      throw new NotFoundException({
        code: ERROR_CODES.NOT_FOUND,
        message: `Categoría con id ${id} no encontrada`,
      });
    }
    return category;
  }

  /**
   * Retorna una categoría por slug.
   * Lanza NotFoundException si no existe.
   */
  async findBySlug(slug: string): Promise<CategoryFlat> {
    const category = await this.categoriesRepository.findBySlug(slug);
    if (!category) {
      throw new NotFoundException({
        code: ERROR_CODES.NOT_FOUND,
        message: `Categoría con slug "${slug}" no encontrada`,
      });
    }
    return category;
  }
}
