import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrderStatus } from '@prisma/client';
import { EVENT_NAMES } from '../../../common/events/event-types';
import { OrderConfirmedEvent } from '../../orders/events/order-confirmed.event';
import { AdminOrdersRepository } from './admin-orders.repository';
import { OrderStatusValidationService } from './services/order-status-validation.service';
import { AdminOrderQueryDto } from './dto/admin-order-query.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { AdminOrderDetail, PaginatedAdminOrders } from './interfaces/admin-order.interface';

@Injectable()
export class AdminOrdersService {
  constructor(
    private readonly adminOrdersRepository: AdminOrdersRepository,
    private readonly orderStatusValidationService: OrderStatusValidationService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  findAll(filters: AdminOrderQueryDto): Promise<PaginatedAdminOrders> {
    return this.adminOrdersRepository.findAllWithFilters(filters);
  }

  findById(id: string): Promise<AdminOrderDetail> {
    return this.adminOrdersRepository.findByIdForAdmin(id);
  }

  findByOrderNumber(orderNumber: string): Promise<AdminOrderDetail> {
    return this.adminOrdersRepository.findByOrderNumberForAdmin(orderNumber);
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto): Promise<AdminOrderDetail> {
    const order = await this.adminOrdersRepository.findByIdForAdmin(id);

    this.orderStatusValidationService.validateStatusTransition(
      order.status as OrderStatus,
      dto.status,
    );

    let updatedOrder: AdminOrderDetail;

    if (dto.status === OrderStatus.cancelled) {
      updatedOrder = await this.adminOrdersRepository.updateStatus(
        id,
        dto.status,
        order.orderNumber,
        order.items.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
      );
    } else {
      updatedOrder = await this.adminOrdersRepository.updateStatus(
        id,
        dto.status,
        order.orderNumber,
      );
    }

    if (dto.status === OrderStatus.confirmed) {
      this.eventEmitter.emit(
        EVENT_NAMES.order.confirmed,
        new OrderConfirmedEvent(id, updatedOrder.orderNumber, updatedOrder),
      );
    }

    return updatedOrder;
  }
}
