/**
 * Filtros de búsqueda y paginación para el listado de productos.
 */
export type ProductSortBy =
  | 'name-asc'
  | 'name-desc'
  | 'price-asc'
  | 'price-desc'
  | 'newest'
  | 'oldest';

export interface ProductFilters {
  search?: string;
  /** IDs de categorías (ya parseados desde el query param) */
  categoryIds?: string[];
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  isFeatured?: boolean;
  hasDiscount?: boolean;
  sortBy?: ProductSortBy;
  page?: number;
  limit?: number;
}
