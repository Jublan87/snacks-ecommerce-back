import { Injectable } from '@nestjs/common';
import { Product } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { BaseRepository } from '../../database/repositories/base.repository';
import { ProductListItem } from './interfaces/product-list-item.interface';
import { ProductWithRelations } from './interfaces/product-with-relations.interface';
import { PRODUCT_LIST_INCLUDE, PRODUCT_DETAIL_INCLUDE } from './utils/product-includes.const';
import { toProductListItem, toProductWithRelations } from './utils/product-mappers';

@Injectable()
export class ProductsRepository extends BaseRepository<
  Product,
  Prisma.ProductCreateInput,
  Prisma.ProductUpdateInput,
  Prisma.ProductWhereInput
> {
  constructor(prisma: PrismaService) {
    super(prisma, 'product');
  }

  /**
   * Listado paginado con filtros. count y findMany en paralelo para eficiencia.
   */
  async findAllWithFilters(
    where: Prisma.ProductWhereInput,
    orderBy: Prisma.ProductOrderByWithRelationInput[],
    page: number,
    limit: number,
    isAdmin = false,
  ): Promise<{ items: ProductListItem[]; total: number }> {
    const skip = (page - 1) * limit;

    const [rows, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: PRODUCT_LIST_INCLUDE,
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      items: rows.map((row) => toProductListItem(row, { excludeCostPrice: !isAdmin })),
      total,
    };
  }

  /**
   * Producto completo por ID con todas las relaciones.
   */
  async findByIdWithRelations(id: string, isAdmin = false): Promise<ProductWithRelations | null> {
    const row = await this.prisma.product.findUnique({
      where: { id },
      include: PRODUCT_DETAIL_INCLUDE,
    });

    if (!row) return null;
    return toProductWithRelations(row, { excludeCostPrice: !isAdmin });
  }

  /**
   * Producto completo por slug con todas las relaciones.
   */
  async findBySlug(slug: string, isAdmin = false): Promise<ProductWithRelations | null> {
    const row = await this.prisma.product.findUnique({
      where: { slug },
      include: PRODUCT_DETAIL_INCLUDE,
    });

    if (!row) return null;
    return toProductWithRelations(row, { excludeCostPrice: !isAdmin });
  }

  /**
   * Productos destacados (isFeatured=true, isActive=true).
   */
  async findFeatured(limit = 8): Promise<ProductListItem[]> {
    const rows = await this.prisma.product.findMany({
      where: { isFeatured: true, isActive: true },
      include: PRODUCT_LIST_INCLUDE,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return rows.map((row) => toProductListItem(row, { excludeCostPrice: true }));
  }

  /**
   * Productos de una categoría específica.
   */
  async findByCategory(categoryId: string): Promise<ProductListItem[]> {
    const rows = await this.prisma.product.findMany({
      where: { categoryId, isActive: true },
      include: PRODUCT_LIST_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((row) => toProductListItem(row, { excludeCostPrice: true }));
  }
}
