import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { ProductWithRelations } from '../../products/interfaces/product-with-relations.interface';
import { ERROR_CODES } from '../../../common/constants/error-codes';
import { SlugService } from '../shared/slug.service';
import {
  IMAGE_STORAGE_ADAPTER,
  ImageStorageAdapter,
} from '../admin-upload/interfaces/image-storage.interface';
import { AdminProductsRepository } from './admin-products.repository';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateProductImageDto } from './dto/update-product-image.dto';
import { UpdateProductVariantDto } from './dto/update-product-variant.dto';
import { UpdateStockDto } from './dto/update-stock.dto';

@Injectable()
export class AdminProductsService {
  private readonly logger = new Logger(AdminProductsService.name);

  constructor(
    private readonly repo: AdminProductsRepository,
    private readonly prisma: PrismaService,
    private readonly slugService: SlugService,
    @Inject(IMAGE_STORAGE_ADAPTER)
    private readonly storageAdapter: ImageStorageAdapter,
  ) {}

  /**
   * Crea un nuevo producto con sus imágenes y variantes.
   */
  async create(dto: CreateProductDto): Promise<ProductWithRelations> {
    const categoryExists = await this.prisma.category.findUnique({
      where: { id: dto.categoryId },
      select: { id: true },
    });
    if (!categoryExists) {
      throw new NotFoundException({
        code: ERROR_CODES.CATEGORY_NOT_FOUND,
        message: `Categoría con id ${dto.categoryId} no encontrada`,
      });
    }

    const skuTaken = await this.repo.skuExists(dto.sku);
    if (skuTaken) {
      throw new ConflictException({
        code: ERROR_CODES.SKU_DUPLICATE,
        message: `Ya existe un producto con el SKU "${dto.sku}"`,
      });
    }

    const slug = await this.slugService.generateUniqueProductSlug(dto.name);
    const discountPrice = this.calcDiscountPrice(dto.price, dto.discountPercentage);

    const created = await this.prisma.product.create({
      data: {
        name: dto.name,
        slug,
        description: dto.description,
        shortDescription: dto.shortDescription ?? null,
        sku: dto.sku,
        price: dto.price,
        discountPrice,
        discountPercentage: dto.discountPercentage ?? null,
        stock: dto.stock ?? 0,
        categoryId: dto.categoryId,
        specifications: (dto.specifications ?? undefined) as Prisma.InputJsonValue | undefined,
        isActive: dto.isActive ?? true,
        isFeatured: dto.isFeatured ?? false,
        tags: dto.tags ?? [],
        weight: dto.weight ?? null,
        dimensions: (dto.dimensions ?? undefined) as Prisma.InputJsonValue | undefined,
        images: {
          create: dto.images.map((img, index) => ({
            url: img.url,
            storageKey: img.storageKey ?? null,
            alt: img.alt,
            isPrimary: index === 0,
            order: img.order ?? index,
          })),
        },
        variants: dto.variants?.length
          ? {
              create: dto.variants.map((v) => ({
                name: v.name,
                options: {
                  create: v.options.map((o) => ({
                    value: o.value,
                    priceModifier: o.priceModifier ?? null,
                    stock: o.stock,
                    sku: o.sku ?? null,
                  })),
                },
              })),
            }
          : undefined,
      },
      select: { id: true },
    });

    // Producto creado OK → confirmar imágenes (limpiar PendingUpload)
    const storageKeys =
      dto.images?.map((img) => img.storageKey).filter((key): key is string => !!key) ?? [];

    if (storageKeys.length > 0) {
      await this.prisma.pendingUpload.deleteMany({
        where: { storageKey: { in: storageKeys } },
      });
    }

    return this.fetchProduct(created.id);
  }

  /**
   * Actualiza un producto existente.
   */
  async update(id: string, dto: UpdateProductDto): Promise<ProductWithRelations> {
    const existing = await this.fetchProduct(id);

    if (dto.categoryId !== undefined) {
      const categoryExists = await this.prisma.category.findUnique({
        where: { id: dto.categoryId },
        select: { id: true },
      });
      if (!categoryExists) {
        throw new NotFoundException({
          code: ERROR_CODES.CATEGORY_NOT_FOUND,
          message: `Categoría con id ${dto.categoryId} no encontrada`,
        });
      }
    }

    if (dto.sku !== undefined && dto.sku !== existing.sku) {
      const skuTaken = await this.repo.skuExists(dto.sku, id);
      if (skuTaken) {
        throw new ConflictException({
          code: ERROR_CODES.SKU_DUPLICATE,
          message: `Ya existe un producto con el SKU "${dto.sku}"`,
        });
      }
    }

    let slug: string | undefined;
    if (dto.name !== undefined) {
      slug = await this.slugService.generateUniqueProductSlug(dto.name, id);
    }

    const newPrice = dto.price ?? existing.price;
    const newDiscountPct = dto.discountPercentage ?? existing.discountPercentage;
    const discountPrice = this.calcDiscountPrice(newPrice, newDiscountPct);

    // Transacción: reemplaza imágenes/variantes en DB y devuelve los storageKeys viejos.
    // NO borra de Cloudinary adentro — si la tx falla, no quedan assets borrados sin referencia.
    const oldStorageKeys = await this.prisma.$transaction(async (tx) => {
      let keys: string[] = [];
      if (dto.images !== undefined) {
        keys = await this.replaceImages(tx, id, dto.images);
      }
      if (dto.variants !== undefined) {
        await this.replaceVariants(tx, id, dto.variants);
      }
      await tx.product.update({
        where: { id },
        data: this.buildScalarUpdateData(dto, slug, discountPrice),
      });
      return keys;
    });

    // Confirmar imágenes nuevas (limpiar PendingUpload)
    const newStorageKeys =
      dto.images?.map((img) => img.storageKey).filter((key): key is string => !!key) ?? [];

    // Post-commit: borrar de Cloudinary solo las imágenes que NO se reusan en las nuevas
    const keysToDelete = oldStorageKeys.filter((key) => !newStorageKeys.includes(key));
    if (keysToDelete.length > 0) {
      await Promise.all(
        keysToDelete.map((key) => this.storageAdapter.delete(key).catch(() => undefined)),
      );
    }

    if (newStorageKeys.length > 0) {
      await this.prisma.pendingUpload.deleteMany({
        where: { storageKey: { in: newStorageKeys } },
      });
    }

    return this.fetchProduct(id);
  }

  /**
   * Soft delete: marca el producto como inactivo.
   */
  async softDelete(id: string): Promise<ProductWithRelations> {
    await this.fetchProduct(id);
    await this.prisma.product.update({ where: { id }, data: { isActive: false } });
    return this.fetchProduct(id);
  }

  /**
   * Elimina una imagen del producto.
   * Lanza error si es la única imagen.
   * Si era la imagen primaria, promueve la siguiente.
   */
  async deleteImage(productId: string, imageId: string): Promise<void> {
    const image = await this.repo.findImageById(imageId, productId);
    if (!image) {
      throw new NotFoundException({
        code: ERROR_CODES.NOT_FOUND,
        message: `Imagen con id ${imageId} no encontrada para el producto ${productId}`,
      });
    }

    const count = await this.repo.countImages(productId);
    if (count <= 1) {
      throw new BadRequestException({
        code: ERROR_CODES.LAST_IMAGE,
        message: 'No se puede eliminar la única imagen del producto',
      });
    }

    // DB primero — si falla, Cloudinary no se toca y queda consistente
    await this.prisma.$transaction(async (tx) => {
      await tx.productImage.delete({ where: { id: imageId } });
      if (image.isPrimary) {
        const next = await this.repo.findNextImage(productId, imageId);
        if (next) {
          await tx.productImage.update({ where: { id: next.id }, data: { isPrimary: true } });
        }
      }
    });

    // Post-commit: borrar de Cloudinary (fire-and-forget)
    if (image.storageKey) {
      this.storageAdapter.delete(image.storageKey).catch(() => undefined);
    }
  }

  /**
   * Elimina una variante del producto.
   */
  async deleteVariant(productId: string, variantId: string): Promise<void> {
    const variant = await this.repo.findVariantById(variantId, productId);
    if (!variant) {
      throw new NotFoundException({
        code: ERROR_CODES.NOT_FOUND,
        message: `Variante con id ${variantId} no encontrada para el producto ${productId}`,
      });
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.variantOption.deleteMany({ where: { variantId } });
      await tx.productVariant.delete({ where: { id: variantId } });
    });
  }

  /**
   * Actualiza el stock de un producto y registra el cambio en StockHistory.
   */
  async updateStock(id: string, dto: UpdateStockDto): Promise<ProductWithRelations> {
    const product = await this.fetchProduct(id);
    return this.repo.updateStockWithHistory(
      id,
      product.name,
      product.stock,
      dto.newStock,
      dto.reason,
    );
  }

  // ─── Helpers privados ────────────────────────────────────────────────────────

  private async fetchProduct(id: string): Promise<ProductWithRelations> {
    const product = await this.repo.findByIdWithRelations(id);
    if (!product) {
      throw new NotFoundException({
        code: ERROR_CODES.NOT_FOUND,
        message: `Producto con id ${id} no encontrado`,
      });
    }
    return product;
  }

  private calcDiscountPrice(price: number, discountPct?: number | null): number | null {
    if (discountPct == null || discountPct <= 0) return null;
    return price * (1 - discountPct / 100);
  }

  private buildScalarUpdateData(
    dto: UpdateProductDto,
    slug: string | undefined,
    discountPrice: number | null,
  ): Prisma.ProductUncheckedUpdateInput {
    return {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(slug !== undefined && { slug }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.shortDescription !== undefined && { shortDescription: dto.shortDescription }),
      ...(dto.sku !== undefined && { sku: dto.sku }),
      ...(dto.price !== undefined && { price: dto.price }),
      discountPrice,
      ...(dto.discountPercentage !== undefined && { discountPercentage: dto.discountPercentage }),
      ...(dto.stock !== undefined && { stock: dto.stock }),
      ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
      ...(dto.specifications !== undefined && {
        specifications: dto.specifications as Prisma.InputJsonValue,
      }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      ...(dto.isFeatured !== undefined && { isFeatured: dto.isFeatured }),
      ...(dto.tags !== undefined && { tags: dto.tags }),
      ...(dto.weight !== undefined && { weight: dto.weight }),
      ...(dto.dimensions !== undefined && { dimensions: dto.dimensions as Prisma.InputJsonValue }),
    };
  }

  // Solo opera en DB (dentro de transacción). Devuelve los storageKeys viejos
  // para que el caller los borre de Cloudinary DESPUÉS del commit.
  private async replaceImages(
    tx: Prisma.TransactionClient,
    productId: string,
    images: UpdateProductImageDto[],
  ): Promise<string[]> {
    const existing = await tx.productImage.findMany({
      where: { productId },
      select: { storageKey: true },
    });

    await tx.productImage.deleteMany({ where: { productId } });

    if (images.length > 0) {
      await tx.productImage.createMany({
        data: images.map((img, index) => ({
          productId,
          url: img.url,
          storageKey: img.storageKey ?? null,
          alt: img.alt,
          isPrimary: index === 0,
          order: img.order ?? index,
        })),
      });
    }

    return existing.filter((img) => img.storageKey).map((img) => img.storageKey!);
  }

  private async replaceVariants(
    tx: Prisma.TransactionClient,
    productId: string,
    variants: UpdateProductVariantDto[],
  ): Promise<void> {
    const existingVariants = await tx.productVariant.findMany({
      where: { productId },
      select: { id: true },
    });
    const variantIds = existingVariants.map((v) => v.id);
    if (variantIds.length > 0) {
      await tx.variantOption.deleteMany({ where: { variantId: { in: variantIds } } });
    }
    await tx.productVariant.deleteMany({ where: { productId } });

    for (const variant of variants) {
      await tx.productVariant.create({
        data: {
          productId,
          name: variant.name,
          options: {
            create: variant.options.map((o) => ({
              value: o.value,
              priceModifier: o.priceModifier ?? null,
              stock: o.stock,
              sku: o.sku ?? null,
            })),
          },
        },
      });
    }
  }
}
