import { AdminOrderDetail } from '../../admin/admin-orders/interfaces/admin-order.interface';

export class OrderConfirmedEvent {
  constructor(
    public readonly orderId: string,
    public readonly orderNumber: string,
    public readonly orderDetail: AdminOrderDetail,
  ) {}
}
