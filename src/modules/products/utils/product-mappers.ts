import { ProductListItem } from '../interfaces/product-list-item.interface';
import {
  ProductWithRelations,
  ProductImageItem,
  ProductVariantItem,
  VariantOptionItem,
  ProductCategory,
} from '../interfaces/product-with-relations.interface';
import { ProductListRow, ProductDetailRow } from './product-includes.const';

/**
 * Convierte un Decimal de Prisma (duck-typed) a number | null.
 * No importar Decimal desde @prisma/client/runtime/library (no disponible en Prisma v7).
 */
export function toNumber(decimal: { toNumber(): number } | null): number | null {
  return decimal ? decimal.toNumber() : null;
}

export function toProductImage(image: {
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

export function toProductVariant(variant: {
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

export function toProductListItem(row: ProductListRow): ProductListItem {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    sku: row.sku,
    shortDescription: row.shortDescription,
    price: row.price.toNumber(),
    discountPrice: toNumber(row.discountPrice),
    discountPercentage: row.discountPercentage,
    stock: row.stock,
    isActive: row.isActive,
    isFeatured: row.isFeatured,
    tags: row.tags,
    categoryId: row.categoryId,
    category: row.category as ProductCategory,
    images: row.images.map(toProductImage),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function toProductWithRelations(row: ProductDetailRow): ProductWithRelations {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    shortDescription: row.shortDescription,
    sku: row.sku,
    price: row.price.toNumber(),
    discountPrice: toNumber(row.discountPrice),
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
    images: row.images.map(toProductImage),
    variants: row.variants.map(toProductVariant),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
