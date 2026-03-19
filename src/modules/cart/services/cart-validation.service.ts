import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CartItem, Product } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { ERROR_CODES } from '../../../common/constants/error-codes';

type CartItemWithRelations = CartItem & {
  cart: { userId: string };
  product: Product;
};

@Injectable()
export class CartValidationService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Valida que el producto exista, esté activo y tenga stock suficiente.
   */
  async validateProductForCart(productId: string, quantity: number): Promise<void> {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });

    if (!product) {
      throw new NotFoundException({
        code: ERROR_CODES.NOT_FOUND,
        message: `Producto con id ${productId} no encontrado`,
      });
    }

    if (!product.isActive) {
      throw new BadRequestException({
        code: ERROR_CODES.PRODUCT_INACTIVE,
        message: 'El producto no está disponible',
      });
    }

    if (product.stock < quantity) {
      throw new BadRequestException({
        code: ERROR_CODES.INSUFFICIENT_STOCK,
        message: 'Stock insuficiente',
        details: {
          available: product.stock,
          requested: quantity,
        },
      });
    }
  }

  /**
   * Valida que el item pertenezca al carrito del usuario autenticado.
   * Retorna el item con su producto para reutilizar en el servicio.
   */
  async validateItemOwnership(itemId: string, userId: string): Promise<CartItemWithRelations> {
    const item = await this.prisma.cartItem.findUnique({
      where: { id: itemId },
      include: {
        cart: { select: { userId: true } },
        product: true,
      },
    });

    if (!item || item.cart.userId !== userId) {
      throw new NotFoundException({
        code: ERROR_CODES.CART_ITEM_NOT_FOUND,
        message: 'Item del carrito no encontrado',
      });
    }

    return item as CartItemWithRelations;
  }
}
