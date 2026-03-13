import { Injectable } from '@nestjs/common';
import { Cart, Prisma } from '@prisma/client';
import { BaseRepository } from '../../database/repositories/base.repository';
import { PrismaService } from '../../database/prisma.service';
import { CartItemDetail, CartProductImage, CartWithItems } from './interfaces/cart.interfaces';

const CART_ITEM_INCLUDE = {
  items: {
    include: {
      product: {
        include: {
          images: { orderBy: { order: 'asc' as const } },
        },
      },
    },
  },
} satisfies Prisma.CartInclude;

type CartWithItemsRaw = Prisma.CartGetPayload<{ include: typeof CART_ITEM_INCLUDE }>;
type CartItemRaw = CartWithItemsRaw['items'][number];

@Injectable()
export class CartRepository extends BaseRepository<
  Cart,
  Prisma.CartCreateInput,
  Prisma.CartUpdateInput,
  Prisma.CartWhereInput
> {
  constructor(prisma: PrismaService) {
    super(prisma, 'cart');
  }

  async findByUserId(userId: string): Promise<CartWithItems | null> {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: CART_ITEM_INCLUDE,
    });
    if (!cart) return null;
    return this.toCartWithItems(cart);
  }

  async findOrCreate(userId: string): Promise<CartWithItems> {
    await this.prisma.cart.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: CART_ITEM_INCLUDE,
    });
    return this.toCartWithItems(cart!);
  }

  async upsertItem(cartId: string, productId: string, quantity: number): Promise<CartItemDetail> {
    const existing = await this.prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId, productId } },
    });

    const item = await this.prisma.cartItem.upsert({
      where: { cartId_productId: { cartId, productId } },
      create: { cartId, productId, quantity },
      update: { quantity: { increment: quantity } },
      include: {
        product: {
          include: { images: { orderBy: { order: 'asc' } } },
        },
      },
    });

    // Refresh after upsert to get updated quantity
    void existing;
    return this.toCartItemDetail(item as CartItemRaw);
  }

  async updateItemQuantity(itemId: string, quantity: number): Promise<CartItemDetail> {
    const item = await this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
      include: {
        product: {
          include: { images: { orderBy: { order: 'asc' } } },
        },
      },
    });
    return this.toCartItemDetail(item as CartItemRaw);
  }

  async removeItem(itemId: string): Promise<void> {
    await this.prisma.cartItem.delete({ where: { id: itemId } });
  }

  async clearCart(cartId: string): Promise<void> {
    await this.prisma.cartItem.deleteMany({ where: { cartId } });
  }

  private toCartWithItems(cart: CartWithItemsRaw): CartWithItems {
    return {
      id: cart.id,
      userId: cart.userId,
      updatedAt: cart.updatedAt,
      items: cart.items.map((item) => this.toCartItemDetail(item)),
    };
  }

  private toCartItemDetail(item: CartItemRaw): CartItemDetail {
    const product = item.product;
    const images: CartProductImage[] = product.images.map((img) => ({
      id: img.id,
      url: img.url,
      alt: img.alt ?? '',
      isPrimary: img.isPrimary,
      order: img.order,
    }));

    const price = this.toNumber(product.price);
    const discountPrice = this.toNumber(product.discountPrice);

    return {
      id: item.id,
      cartId: item.cartId,
      productId: item.productId,
      quantity: item.quantity,
      addedAt: item.addedAt,
      product: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price,
        discountPrice,
        stock: product.stock,
        isActive: product.isActive,
        images,
      },
      isAvailable: product.isActive && product.stock >= item.quantity,
    };
  }

  private toNumber(decimal: { toNumber(): number } | null): number | null {
    return decimal !== null ? decimal.toNumber() : null;
  }
}
