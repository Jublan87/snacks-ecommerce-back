import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { EVENT_NAMES } from '../../common/events/event-types';
import { ShippingService } from '../shipping/shipping.service';
import { OrdersRepository } from './orders.repository';
import { OrderCalculationService } from './services/order-calculation.service';
import { OrderValidationService } from './services/order-validation.service';
import { OrderNumberGeneratorService } from './services/order-number-generator.service';
import { StockManagementService } from './services/stock-management.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderQueryDto } from './dto/order-query.dto';
import { OrderCreatedEvent } from './events/order-created.event';
import { OrderDetail, PaginatedOrders } from './interfaces/order.interfaces';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ordersRepository: OrdersRepository,
    private readonly orderCalculationService: OrderCalculationService,
    private readonly orderValidationService: OrderValidationService,
    private readonly orderNumberGeneratorService: OrderNumberGeneratorService,
    private readonly stockManagementService: StockManagementService,
    private readonly shippingService: ShippingService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createOrder(userId: string, dto: CreateOrderDto): Promise<OrderDetail> {
    // 1. Validar items y capturar precios actuales
    const pricedItems = await this.orderValidationService.validateAndPriceItems(dto.items);

    // 2. Calcular totales
    const subtotal = this.orderCalculationService.calculateSubtotal(pricedItems);
    const shippingResult = this.shippingService.calculate({ subtotal });
    const total = this.orderCalculationService.calculateTotal(subtotal, shippingResult.shipping);

    // 3. Generar número de orden único
    const orderNumber = this.orderNumberGeneratorService.generate();

    // 4. Crear pedido en transacción atómica
    const order = await this.prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          orderNumber,
          userId,
          shippingAddress: dto.shippingAddress as object,
          paymentMethod: dto.paymentMethod,
          subtotal,
          shipping: shippingResult.shipping,
          total,
          status: OrderStatus.pending,
          notes: dto.notes,
        },
      });

      await tx.orderItem.createMany({
        data: pricedItems.map((item) => ({
          orderId: created.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.price * item.quantity,
          costPriceSnapshot: item.costPrice,
        })),
      });

      await this.stockManagementService.decreaseStock(pricedItems, tx);
      await this.stockManagementService.recordStockHistory(pricedItems, tx);

      return created;
    });

    // 5. Post-commit: emitir evento (CartListener vaciará el carrito — operación eventual)
    this.eventEmitter.emit(EVENT_NAMES.order.created, new OrderCreatedEvent(order.id, userId));

    // 6. Retornar pedido completo con todas las relaciones
    return this.ordersRepository.findByIdForUser(order.id, userId);
  }

  async getOrders(userId: string, query: OrderQueryDto): Promise<PaginatedOrders> {
    return this.ordersRepository.findByUserId(userId, query);
  }

  async getOrderById(userId: string, id: string): Promise<OrderDetail> {
    return this.ordersRepository.findByIdForUser(id, userId);
  }

  async getOrderByNumber(userId: string, orderNumber: string): Promise<OrderDetail> {
    return this.ordersRepository.findByOrderNumberForUser(orderNumber, userId);
  }
}
