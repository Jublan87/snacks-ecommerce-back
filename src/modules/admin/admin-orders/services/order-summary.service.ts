import { Injectable } from '@nestjs/common';
import { AdminOrderSummary } from '../interfaces/admin-order.interface';

@Injectable()
export class OrderSummaryService {
  buildSummary(
    totalOrders: number,
    totalRevenue: number,
    ordersByStatus: Record<string, number>,
  ): AdminOrderSummary {
    return {
      totalOrders,
      totalRevenue: Number.parseFloat(totalRevenue.toFixed(2)),
      averageOrderValue: Number.parseFloat(
        (totalOrders > 0 ? totalRevenue / totalOrders : 0).toFixed(2),
      ),
      ordersByStatus,
    };
  }
}
