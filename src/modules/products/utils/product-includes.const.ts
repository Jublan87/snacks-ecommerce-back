import type { Prisma } from '@prisma/client';

/**
 * Include para listados de productos: categoría e imágenes ordenadas.
 */
export const PRODUCT_LIST_INCLUDE = {
  category: {
    select: { id: true, name: true, slug: true },
  },
  images: {
    orderBy: { order: 'asc' as const },
  },
} satisfies Prisma.ProductInclude;

/**
 * Include para detalle de producto: categoría, imágenes y variantes con opciones.
 */
export const PRODUCT_DETAIL_INCLUDE = {
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

export type ProductListRow = Prisma.ProductGetPayload<{ include: typeof PRODUCT_LIST_INCLUDE }>;
export type ProductDetailRow = Prisma.ProductGetPayload<{ include: typeof PRODUCT_DETAIL_INCLUDE }>;
