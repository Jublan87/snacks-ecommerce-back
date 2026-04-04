/**
 * Categoría sin relaciones (lista plana).
 * Sin dependencias de Prisma.
 */
export interface CategoryFlat {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  image: string | null;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
