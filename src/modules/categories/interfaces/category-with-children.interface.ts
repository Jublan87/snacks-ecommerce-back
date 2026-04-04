import { CategoryFlat } from './category-flat.interface';

/**
 * Categoría con sus hijos directos (estructura jerárquica de 2 niveles).
 * Sin dependencias de Prisma.
 */
export interface CategoryWithChildren extends CategoryFlat {
  children: CategoryFlat[];
}
