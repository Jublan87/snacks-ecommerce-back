import { Injectable } from '@nestjs/common';
import { Product } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { BaseRepository } from '../../../database/repositories/base.repository';
import { ProductWithRelations } from '../../products/interfaces/product-with-relations.interface';
import { PRODUCT_DETAIL_INCLUDE } from '../../products/utils/product-includes.const';
import { toProductWithRelations } from '../../products/utils/product-mappers';

@Injectable()
export class AdminProductsRepository extends BaseRepository<
  Product,
  Prisma.ProductCreateInput,
  Prisma.ProductUpdateInput,
  Prisma.ProductWhereInput
> {
  constructor(prisma: PrismaService) {
    super(prisma, 'product');
  }

  /**
   * Verifica si existe otro producto con el SKU dado (excluyendo el ID indicado).
   */
  async skuExists(sku: string, excludeId?: string): Promise<boolean> {
    const count = await this.prisma.product.count({
      where: {
        sku,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    return count > 0;
  }

  /**
   * Producto completo por ID con todas las relaciones (incluye inactivos).
   */
  async findByIdWithRelations(id: string): Promise<ProductWithRelations | null> {
    const row = await this.prisma.product.findUnique({
      where: { id },
      include: PRODUCT_DETAIL_INCLUDE,
    });
    if (!row) return null;
    return toProductWithRelations(row);
  }

  /**
   * Busca una imagen por ID verificando que pertenezca al producto indicado.
   */
  async findImageById(imageId: string, productId: string) {
    return this.prisma.productImage.findFirst({
      where: { id: imageId, productId },
    });
  }

  /**
   * Cuenta cuántas imágenes tiene un producto.
   */
  async countImages(productId: string): Promise<number> {
    return this.prisma.productImage.count({ where: { productId } });
  }

  /**
   * Busca la imagen con menor order (excluyendo la indicada) para promover como primaria.
   */
  async findNextImage(productId: string, excludeImageId: string) {
    return this.prisma.productImage.findFirst({
      where: { productId, id: { not: excludeImageId } },
      orderBy: { order: 'asc' },
    });
  }

  /**
   * Busca una variante por ID verificando que pertenezca al producto indicado.
   */
  async findVariantById(variantId: string, productId: string) {
    return this.prisma.productVariant.findFirst({
      where: { id: variantId, productId },
    });
  }

  /**
   * Actualiza el stock de un producto y registra el cambio en StockHistory,
   * todo dentro de una transacción atómica.
   */
  async updateStockWithHistory(
    productId: string,
    productName: string,
    previousStock: number,
    newStock: number,
    reason?: string,
  ): Promise<ProductWithRelations> {
    await this.prisma.$transaction([
      this.prisma.product.update({
        where: { id: productId },
        data: { stock: newStock },
      }),
      this.prisma.stockHistory.create({
        data: {
          productId,
          productName,
          previousStock,
          newStock,
          reason: reason ?? 'Actualización manual',
        },
      }),
    ]);

    const updated = await this.findByIdWithRelations(productId);

    if (!updated) throw new Error(`Producto ${productId} no encontrado tras actualizar stock`);

    return updated;
  }
}
