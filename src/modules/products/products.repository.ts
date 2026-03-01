import { Injectable } from '@nestjs/common';
import { Product } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { BaseRepository } from '../../database/repositories/base.repository';
import { ProductListItem } from './interfaces/product-list-item.interface';
import {
  ProductWithRelations,
  ProductVariantItem,
  VariantOptionItem,
  ProductImageItem,
  ProductCategory,
} from './interfaces/product-with-relations.interface';

// ─── Constantes de include para reusar en queries ─────────────────────────────

const PRODUCT_LIST_INCLUDE = {
  category: {
    select: { id: true, name: true, slug: true },
  },
  images: {
    orderBy: { order: 'asc' as const },
  },
} satisfies Prisma.ProductInclude;

const PRODUCT_DETAIL_INCLUDE = {
  category: {
    select: { id: true, name: true, slug: true },
  },
  images: {
    orderBy: { order: 'asc' as const },
  },
  variants: {
    include: {
      options: {
        orderBy: { value: 'asc' as const },
      },
    },
    orderBy: { name: 'asc' as const },
  },
} satisfies Prisma.ProductInclude;

// ─── Tipos internos (resultado de Prisma con include) ─────────────────────────

type ProductListRow = Prisma.ProductGetPayload<{ include: typeof PRODUCT_LIST_INCLUDE }>;
type ProductDetailRow = Prisma.ProductGetPayload<{ include: typeof PRODUCT_DETAIL_INCLUDE }>;

// ─── Repositorio ──────────────────────────────────────────────────────────────

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
      items: rows.map((row) => this.toProductListItem(row)),
      total,
    };
  }

  /**
   * Producto completo por ID con todas las relaciones.
   */
  async findByIdWithRelations(id: string): Promise<ProductWithRelations | null> {
    const row = await this.prisma.product.findUnique({
      where: { id },
      include: PRODUCT_DETAIL_INCLUDE,
    });

    if (!row) return null;
    return this.toProductWithRelations(row);
  }

  /**
   * Producto completo por slug con todas las relaciones.
   */
  async findBySlug(slug: string): Promise<ProductWithRelations | null> {
    const row = await this.prisma.product.findUnique({
      where: { slug },
      include: PRODUCT_DETAIL_INCLUDE,
    });

    if (!row) return null;
    return this.toProductWithRelations(row);
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

    return rows.map((row) => this.toProductListItem(row));
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

    return rows.map((row) => this.toProductListItem(row));
  }

  // ─── Mappers privados ──────────────────────────────────────────────────────

  private toNumber(decimal: { toNumber(): number } | null): number | null {
    return decimal ? decimal.toNumber() : null;
  }

  private toProductListItem(row: ProductListRow): ProductListItem {
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      shortDescription: row.shortDescription,
      price: row.price.toNumber(),
      discountPrice: this.toNumber(row.discountPrice),
      discountPercentage: row.discountPercentage,
      stock: row.stock,
      isActive: row.isActive,
      isFeatured: row.isFeatured,
      tags: row.tags,
      categoryId: row.categoryId,
      category: row.category as ProductCategory,
      images: row.images.map(this.toProductImage),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private toProductWithRelations(row: ProductDetailRow): ProductWithRelations {
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      shortDescription: row.shortDescription,
      sku: row.sku,
      price: row.price.toNumber(),
      discountPrice: this.toNumber(row.discountPrice),
      discountPercentage: row.discountPercentage,
      stock: row.stock,
      categoryId: row.categoryId,
      category: row.category as ProductCategory,
      specifications: row.specifications,
      isActive: row.isActive,
      isFeatured: row.isFeatured,
      tags: row.tags,
      weight: row.weight ? row.weight.toNumber() : null,
      dimensions: row.dimensions,
      images: row.images.map(this.toProductImage),
      variants: row.variants.map(this.toProductVariant),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private toProductImage(image: {
    id: string;
    url: string;
    alt: string;
    isPrimary: boolean;
    order: number;
  }): ProductImageItem {
    return {
      id: image.id,
      url: image.url,
      alt: image.alt,
      isPrimary: image.isPrimary,
      order: image.order,
    };
  }

  private toProductVariant(variant: {
    id: string;
    name: string;
    options: Array<{
      id: string;
      value: string;
      priceModifier: { toNumber(): number } | null;
      stock: number;
      sku: string | null;
    }>;
  }): ProductVariantItem {
    return {
      id: variant.id,
      name: variant.name,
      options: variant.options.map(
        (opt): VariantOptionItem => ({
          id: opt.id,
          value: opt.value,
          priceModifier: opt.priceModifier ? opt.priceModifier.toNumber() : null,
          stock: opt.stock,
          sku: opt.sku,
        }),
      ),
    };
  }
}
