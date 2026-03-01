import { ProductImageItem, ProductCategory } from './product-with-relations.interface';

/**
 * Producto para listados: versión liviana sin variantes ni specifications.
 * Incluye todas las imágenes (el frontend elige la primaria).
 * Sin dependencias de Prisma.
 */
export interface ProductListItem {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  price: number;
  discountPrice: number | null;
  discountPercentage: number | null;
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
  tags: string[];
  categoryId: string;
  category: ProductCategory;
  images: ProductImageItem[];
  createdAt: Date;
  updatedAt: Date;
}
