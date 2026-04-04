/**
 * Metadata de paginación para respuestas paginadas.
 */
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Calcula la metadata de paginación a partir del total de registros,
 * la página actual y el límite por página.
 */
export function calculatePaginationMeta(
  total: number,
  page: number,
  limit: number,
): PaginationMeta {
  const totalPages = limit > 0 ? Math.ceil(total / limit) : 0;
  return {
    total,
    page,
    limit,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

/**
 * Construye la respuesta paginada estándar.
 */
export function buildPaginatedResponse<T>(
  items: T[],
  meta: PaginationMeta,
): { items: T[]; meta: PaginationMeta } {
  return { items, meta };
}
