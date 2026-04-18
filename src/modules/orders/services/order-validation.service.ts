import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { ERROR_CODES } from '../../../common/constants/error-codes';
import { CreateOrderItemDto } from '../dto/create-order-item.dto';
import { PricedItem } from '../interfaces/order.interfaces';

@Injectable()
export class OrderValidationService {
  constructor(private readonly prisma: PrismaService) {}

  async validateAndPriceItems(items: CreateOrderItemDto[]): Promise<PricedItem[]> {
    const pricedItems: PricedItem[] = [];

    for (const item of items) {
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) {
        throw new NotFoundException({
          message: `Producto con id ${item.productId} no encontrado`,
          code: ERROR_CODES.NOT_FOUND,
        });
      }

      if (!product.isActive) {
        throw new BadRequestException({
          message: `El producto "${product.name}" no está disponible`,
          code: ERROR_CODES.PRODUCT_INACTIVE,
        });
      }

      if (product.stock < item.quantity) {
        throw new BadRequestException({
          message: `Stock insuficiente para "${product.name}"`,
          code: ERROR_CODES.INSUFFICIENT_STOCK,
          details: {
            productId: product.id,
            available: product.stock,
            requested: item.quantity,
          },
        });
      }

      const price =
        product.discountPrice !== null
          ? (product.discountPrice as unknown as { toNumber(): number }).toNumber()
          : (product.salePrice as unknown as { toNumber(): number }).toNumber();

      const costPrice = (product.costPrice as unknown as { toNumber(): number }).toNumber();

      pricedItems.push({
        productId: product.id,
        productName: product.name,
        quantity: item.quantity,
        price,
        costPrice,
        previousStock: product.stock,
      });
    }

    return pricedItems;
  }
}
