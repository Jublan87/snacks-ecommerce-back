import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Order, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { BaseRepository } from '../../database/repositories/base.repository';
import { ERROR_CODES } from '../../common/constants/error-codes';
import {
  OrderDetail,
  OrderProduct,
  OrderProductCategory,
  OrderProductImage,
  OrderItemDetail,
  OrderShippingAddress,
  PaginatedOrders,
} from './interfaces/order.interfaces';
import { OrderQueryDto } from './dto/order-query.dto';

const ORDER_INCLUDE = {
  items: {
    include: {
      product: {
        include: {
          images: { orderBy: { order: 'asc' as const } },
          category: true,
        },
      },
    },
  },
} satisfies Prisma.OrderInclude;

type OrderRaw = Prisma.OrderGetPayload<{ include: typeof ORDER_INCLUDE }>;

@Injectable()
export class OrdersRepository extends BaseRepository<
  Order,
  Prisma.OrderCreateInput,
  Prisma.OrderUpdateInput,
  Prisma.OrderWhereInput
> {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma, 'order');
  }

  async findByUserId(userId: string, query: OrderQueryDto): Promise<PaginatedOrders> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = { userId };
    if (query.status) {
      where.status = query.status as Prisma.EnumOrderStatusFilter;
    }

    const orderBy: Prisma.OrderOrderByWithRelationInput =
      query.sort === 'oldest' ? { createdAt: 'asc' } : { createdAt: 'desc' };

    const [raw, totalItems] = await Promise.all([
      this.prisma.order.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: ORDER_INCLUDE,
      }),
      this.prisma.order.count({ where }),
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    return {
      orders: raw.map((o) => this.toOrderDetail(o)),
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  async findByIdForUser(id: string, userId: string): Promise<OrderDetail> {
    const raw = await this.prisma.order.findUnique({
      where: { id },
      include: ORDER_INCLUDE,
    });

    if (!raw) {
      throw new NotFoundException({
        message: 'Pedido no encontrado',
        code: ERROR_CODES.ORDER_NOT_FOUND,
      });
    }
    if (raw.userId !== userId) {
      throw new ForbiddenException({
        message: 'No tienes permiso para ver este pedido',
        code: ERROR_CODES.FORBIDDEN,
      });
    }

    return this.toOrderDetail(raw);
  }

  async findByOrderNumberForUser(orderNumber: string, userId: string): Promise<OrderDetail> {
    const raw = await this.prisma.order.findUnique({
      where: { orderNumber },
      include: ORDER_INCLUDE,
    });

    if (!raw) {
      throw new NotFoundException({
        message: 'Pedido no encontrado',
        code: ERROR_CODES.ORDER_NOT_FOUND,
      });
    }
    if (raw.userId !== userId) {
      throw new ForbiddenException({
        message: 'No tienes permiso para ver este pedido',
        code: ERROR_CODES.FORBIDDEN,
      });
    }

    return this.toOrderDetail(raw);
  }

  private toNumber(decimal: { toNumber(): number } | null): number {
    return decimal === null ? 0 : decimal.toNumber();
  }

  private toOrderDetail(raw: OrderRaw): OrderDetail {
    return {
      id: raw.id,
      orderNumber: raw.orderNumber,
      userId: raw.userId,
      items: raw.items.map((item) => this.toOrderItemDetail(item)),
      shippingAddress: raw.shippingAddress as unknown as OrderShippingAddress,
      paymentMethod: raw.paymentMethod,
      subtotal: this.toNumber(raw.subtotal as unknown as { toNumber(): number }),
      shipping: this.toNumber(raw.shipping as unknown as { toNumber(): number }),
      total: this.toNumber(raw.total as unknown as { toNumber(): number }),
      status: raw.status,
      notes: raw.notes ?? undefined,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    };
  }

  private toOrderItemDetail(
    item: Prisma.OrderItemGetPayload<{
      include: { product: { include: { images: true; category: true } } };
    }>,
  ): OrderItemDetail {
    const product = item.product;
    const category = product.category;

    const orderProduct: OrderProduct = {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description ?? '',
      images: product.images.map(
        (img): OrderProductImage => ({
          id: img.id,
          url: img.url,
          alt: img.alt,
          isPrimary: img.isPrimary,
          order: img.order,
        }),
      ),
      categoryId: product.categoryId ?? '',
      category: category
        ? ({ id: category.id, name: category.name, slug: category.slug } as OrderProductCategory)
        : ({ id: '', name: '', slug: '' } as OrderProductCategory),
    };

    return {
      id: item.id,
      product: orderProduct,
      quantity: item.quantity,
      price: this.toNumber(item.price as unknown as { toNumber(): number }),
      subtotal: this.toNumber(item.subtotal as unknown as { toNumber(): number }),
    };
  }
}
