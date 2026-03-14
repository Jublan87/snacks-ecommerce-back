import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { PricedItem } from '../interfaces/order.interfaces';

@Injectable()
export class StockManagementService {
  constructor(private readonly prisma: PrismaService) {}

  async decreaseStock(items: PricedItem[], tx: Prisma.TransactionClient): Promise<void> {
    for (const item of items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }
  }

  async recordStockHistory(items: PricedItem[], tx: Prisma.TransactionClient): Promise<void> {
    for (const item of items) {
      await tx.stockHistory.create({
        data: {
          productId: item.productId,
          productName: item.productName,
          previousStock: item.previousStock,
          newStock: item.previousStock - item.quantity,
          reason: `Pedido creado`,
        },
      });
    }
  }
}
