import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { UserRole } from '@prisma/client';
import { DashboardStatsDto } from './dto/dashboard-stats.dto';

@Injectable()
export class AdminDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retorna estadísticas básicas para el dashboard de administración.
   * Todas las consultas se ejecutan en paralelo para minimizar latencia.
   */
  async getStats(): Promise<DashboardStatsDto> {
    // Primer día del mes actual (UTC)
    const now = new Date();
    const firstDayOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

    const [totalProducts, monthlyOrders, revenueResult, totalCustomers] = await Promise.all([
      // Productos activos
      this.prisma.product.count({ where: { isActive: true } }),

      // Órdenes del mes actual
      this.prisma.order.count({
        where: { createdAt: { gte: firstDayOfMonth } },
      }),

      // Ingresos del mes actual (suma de `total`)
      this.prisma.order.aggregate({
        _sum: { total: true },
        where: { createdAt: { gte: firstDayOfMonth } },
      }),

      // Clientes (usuarios con rol customer)
      this.prisma.user.count({ where: { role: UserRole.customer } }),
    ]);

    // El agregado devuelve Decimal | null — lo convertimos a number (0 si es null)
    const rawRevenue = revenueResult._sum.total;
    const monthlyRevenue =
      rawRevenue !== null ? (rawRevenue as { toNumber(): number }).toNumber() : 0;

    return { totalProducts, monthlyOrders, monthlyRevenue, totalCustomers };
  }
}
