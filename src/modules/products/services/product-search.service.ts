import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { ProductFilters, ProductSortBy } from '../interfaces/product-filters.interface';

@Injectable()
export class ProductSearchService {
  /**
   * Construye el objeto WHERE de Prisma a partir de los filtros de dominio.
   * Por defecto filtra solo productos activos.
   * Si filters.isActive está definido (admin), usa ese valor en su lugar.
   */
  buildWhereClause(filters: ProductFilters): Prisma.ProductWhereInput {
    const where: Prisma.ProductWhereInput = {
      isActive: filters.isActive ?? true,
    };

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { shortDescription: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.categoryIds && filters.categoryIds.length > 0) {
      where.categoryId = { in: filters.categoryIds };
    }

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      where.salePrice = {};
      if (filters.minPrice !== undefined) {
        (where.salePrice as Prisma.DecimalFilter).gte = filters.minPrice;
      }
      if (filters.maxPrice !== undefined) {
        (where.salePrice as Prisma.DecimalFilter).lte = filters.maxPrice;
      }
    }

    if (filters.inStock) {
      where.stock = { gt: 0 };
    }

    if (filters.isFeatured) {
      where.isFeatured = true;
    }

    if (filters.hasDiscount) {
      where.discountPrice = { not: null };
    }

    return where;
  }

  /**
   * Construye el orden de Prisma a partir del parámetro sortBy.
   */
  buildOrderBy(sortBy?: ProductSortBy): Prisma.ProductOrderByWithRelationInput[] {
    switch (sortBy) {
      case 'name-asc':
        return [{ name: 'asc' }];
      case 'name-desc':
        return [{ name: 'desc' }];
      case 'price-asc':
        return [{ salePrice: 'asc' }];
      case 'price-desc':
        return [{ salePrice: 'desc' }];
      case 'oldest':
        return [{ createdAt: 'asc' }];
      case 'newest':
      default:
        return [{ createdAt: 'desc' }];
    }
  }

  /**
   * Parsea el parámetro `category` (string con IDs separados por coma).
   */
  parseCategoryParam(category?: string): string[] {
    if (!category) return [];
    return category
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
}
