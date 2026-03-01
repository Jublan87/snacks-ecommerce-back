/**
 * Filtros de búsqueda para categorías.
 */
export interface CategoryQueryFilters {
  /** Si true, incluye categorías inactivas en el resultado. Por defecto solo activas. */
  includeInactive?: boolean;
}
