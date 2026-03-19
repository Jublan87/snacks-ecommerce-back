import { Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { BaseRepository } from '../../../database/repositories/base.repository';
import { ERROR_CODES } from '../../../common/constants/error-codes';
import {
  calculatePaginationMeta,
  buildPaginatedResponse,
} from '../../../common/utils/pagination.util';
import { AdminOrderQueryDto } from './dto/admin-order-query.dto';
import { AdminOrderDetail, PaginatedAdminOrders } from './interfaces/admin-order.interface';
import { OrderSummaryService } from './services/order-summary.service';

const ORDER_INCLUDE = {
  user: { select: { id: true, email: true, firstName: true, lastName: true } },
  items: {
    include: {
      product: { select: { id: true, name: true, slug: true, sku: true } },
    },
  },
} as const;

@Injectable()
export class AdminOrdersRepository extends BaseRepository<any, any, any, Prisma.OrderWhereInput> {
  constructor(
    prisma: PrismaService,
    private readonly orderSummaryService: OrderSummaryService,
  ) {
    super(prisma, 'order');
  }

  async findAllWithFilters(filters: AdminOrderQueryDto): Promise<PaginatedAdminOrders> {
    const {
      status,
      userId,
      search,
      dateFrom,
      dateTo,
      minTotal,
      maxTotal,
      paymentMethod,
      sort = 'newest',
      page = 1,
      limit = 10,
    } = filters;

    const where: Prisma.OrderWhereInput = {};

    if (status) where.status = status;
    if (userId) where.userId = userId;
    if (paymentMethod) where.paymentMethod = paymentMethod;

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) (where.createdAt as Prisma.DateTimeFilter).gte = new Date(dateFrom);
      if (dateTo) (where.createdAt as Prisma.DateTimeFilter).lte = new Date(dateTo);
    }

    if (minTotal !== undefined || maxTotal !== undefined) {
      where.total = {};
      if (minTotal !== undefined) (where.total as Prisma.DecimalFilter).gte = minTotal;
      if (maxTotal !== undefined) (where.total as Prisma.DecimalFilter).lte = maxTotal;
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { user: { firstName: { contains: search, mode: 'insensitive' } } },
        { user: { lastName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const orderBy = this.buildOrderBy(sort);
    const skip = (page - 1) * limit;

    const [orders, total, aggregate, groupBy] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: ORDER_INCLUDE,
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.order.count({ where }),
      this.prisma.order.aggregate({ where, _sum: { total: true } }),
      this.prisma.order.groupBy({ by: ['status'], where, _count: { status: true } }),
    ]);

    const totalRevenue = aggregate._sum.total ? Number(aggregate._sum.total) : 0;

    const ordersByStatus = groupBy.reduce<Record<string, number>>((acc, entry) => {
      acc[entry.status] = entry._count.status;
      return acc;
    }, {});

    const summary = this.orderSummaryService.buildSummary(total, totalRevenue, ordersByStatus);
    const meta = calculatePaginationMeta(total, page, limit);
    const paginatedResult = buildPaginatedResponse(
      orders.map((o) => this.mapToDetail(o)),
      meta,
    );

    return { ...paginatedResult, summary };
  }

  async findByIdForAdmin(id: string): Promise<AdminOrderDetail> {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: ORDER_INCLUDE,
    });

    if (!order) {
      throw new NotFoundException({
        code: ERROR_CODES.ORDER_NOT_FOUND,
        message: 'Pedido no encontrado',
      });
    }

    return this.mapToDetail(order);
  }

  async findByOrderNumberForAdmin(orderNumber: string): Promise<AdminOrderDetail> {
    const order = await this.prisma.order.findUnique({
      where: { orderNumber },
      include: ORDER_INCLUDE,
    });

    if (!order) {
      throw new NotFoundException({
        code: ERROR_CODES.ORDER_NOT_FOUND,
        message: 'Pedido no encontrado',
      });
    }

    return this.mapToDetail(order);
  }

  async updateStatus(
    id: string,
    newStatus: OrderStatus,
    orderNumber: string,
    items?: Array<{ productId: string; quantity: number }>,
  ): Promise<AdminOrderDetail> {
    if (newStatus === OrderStatus.cancelled && items && items.length > 0) {
      await this.prisma.$transaction(async (tx) => {
        await tx.order.update({ where: { id }, data: { status: newStatus } });

        for (const item of items) {
          const product = await tx.product.findUnique({ where: { id: item.productId } });
          if (!product) {
            throw new NotFoundException({
              code: ERROR_CODES.PRODUCT_NOT_FOUND,
              message: `Producto con id ${item.productId} no encontrado`,
            });
          }
          const previousStock = product.stock;
          const newStock = previousStock + item.quantity;

          await tx.product.update({
            where: { id: item.productId },
            data: { stock: newStock },
          });

          await tx.stockHistory.create({
            data: {
              productId: item.productId,
              productName: product.name,
              previousStock,
              newStock,
              reason: `Pedido cancelado - ${orderNumber}`,
            },
          });
        }
      });
    } else {
      await this.prisma.order.update({ where: { id }, data: { status: newStatus } });
    }

    return this.findByIdForAdmin(id);
  }

  private mapToDetail(order: any): AdminOrderDetail {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      user: {
        id: order.user.id,
        email: order.user.email,
        firstName: order.user.firstName,
        lastName: order.user.lastName,
      },
      items: order.items.map((item: any) => ({
        id: item.id,
        product: {
          id: item.product.id,
          name: item.product.name,
          slug: item.product.slug,
          sku: item.product.sku,
        },
        quantity: item.quantity,
        price: item.price === null ? 0 : item.price.toNumber(),
        subtotal: item.subtotal === null ? 0 : item.subtotal.toNumber(),
      })),
      shippingAddress: order.shippingAddress,
      paymentMethod: order.paymentMethod,
      subtotal: order.subtotal === null ? 0 : order.subtotal.toNumber(),
      shipping: order.shipping === null ? 0 : order.shipping.toNumber(),
      total: order.total === null ? 0 : order.total.toNumber(),
      status: order.status,
      notes: order.notes ?? undefined,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }

  private buildOrderBy(sort: string): Prisma.OrderOrderByWithRelationInput {
    switch (sort) {
      case 'oldest':
        return { createdAt: 'asc' };
      case 'total-asc':
        return { total: 'asc' };
      case 'total-desc':
        return { total: 'desc' };
      default:
        return { createdAt: 'desc' };
    }
  }
}
