import { ApiProperty } from '@nestjs/swagger';

export class DashboardStatsDto {
  @ApiProperty({ description: 'Total de productos activos', example: 42 })
  totalProducts!: number;

  @ApiProperty({ description: 'Órdenes creadas en el mes actual', example: 15 })
  monthlyOrders!: number;

  @ApiProperty({ description: 'Ingresos totales del mes actual', example: 125000.5 })
  monthlyRevenue!: number;

  @ApiProperty({ description: 'Total de clientes registrados', example: 89 })
  totalCustomers!: number;
}
