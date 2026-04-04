import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class SlugService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Convierte un texto a slug base: lowercase, sin acentos, sin caracteres especiales.
   */
  private toBaseSlug(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replaceAll(/[\u0300-\u036f]/g, '') // strip diacritics
      .replaceAll(/[^a-z0-9\s-]/g, '')
      .trim()
      .replaceAll(/\s+/g, '-')
      .replaceAll(/-+/g, '-')
      .replaceAll(/^-|-$/g, '');
  }

  /**
   * Genera un slug único para un producto.
   * Si hay colisión, agrega sufijo numérico: base-2, base-3, etc.
   * @param name Nombre del producto (fuente del slug)
   * @param excludeId ID del producto a excluir (para actualizaciones)
   */
  async generateUniqueProductSlug(name: string, excludeId?: string): Promise<string> {
    const base = this.toBaseSlug(name);
    let candidate = base;
    let counter = 2;

    while (true) {
      const existing = await this.prisma.product.findFirst({
        where: {
          slug: candidate,
          ...(excludeId ? { id: { not: excludeId } } : {}),
        },
        select: { id: true },
      });

      if (!existing) return candidate;
      candidate = `${base}-${counter++}`;
    }
  }

  /**
   * Genera un slug único para una categoría.
   * Si hay colisión, agrega sufijo numérico: base-2, base-3, etc.
   * @param name Nombre de la categoría
   * @param excludeId ID de la categoría a excluir (para actualizaciones)
   */
  async generateUniqueCategorySlug(name: string, excludeId?: string): Promise<string> {
    const base = this.toBaseSlug(name);
    let candidate = base;
    let counter = 2;

    while (true) {
      const existing = await this.prisma.category.findFirst({
        where: {
          slug: candidate,
          ...(excludeId ? { id: { not: excludeId } } : {}),
        },
        select: { id: true },
      });

      if (!existing) return candidate;
      candidate = `${base}-${counter++}`;
    }
  }
}
