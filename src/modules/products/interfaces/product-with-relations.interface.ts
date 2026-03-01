/**
 * Imagen de producto.
 */
export interface ProductImageItem {
  id: string;
  url: string;
  alt: string;
  isPrimary: boolean;
  order: number;
}

/**
 * Opción de variante de producto.
 */
export interface VariantOptionItem {
  id: string;
  value: string;
  priceModifier: number | null;
  stock: number;
  sku: string | null;
}

/**
 * Variante de producto con sus opciones.
 */
export interface ProductVariantItem {
  id: string;
  name: string;
  options: VariantOptionItem[];
}

/**
 * Categoría resumida para incluir en producto.
 */
export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
}

/**
 * Producto completo con todas sus relaciones.
 * Usado para los endpoints de detalle (findById, findBySlug).
 * Sin dependencias de Prisma (Decimal convertido a number).
 */
export interface ProductWithRelations {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string | null;
  sku: string;
  price: number;
  discountPrice: number | null;
  discountPercentage: number | null;
  stock: number;
  categoryId: string;
  category: ProductCategory;
  specifications: unknown;
  isActive: boolean;
  isFeatured: boolean;
  tags: string[];
  weight: number | null;
  dimensions: unknown;
  images: ProductImageItem[];
  variants: ProductVariantItem[];
  createdAt: Date;
  updatedAt: Date;
}
