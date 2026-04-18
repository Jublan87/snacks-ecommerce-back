import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrderStatus } from '@prisma/client';
import { AdminOrdersService } from './admin-orders.service';
import { AdminOrdersRepository } from './admin-orders.repository';
import { OrderStatusValidationService } from './services/order-status-validation.service';
import { EVENT_NAMES } from '../../../common/events/event-types';
import { OrderConfirmedEvent } from '../../orders/events/order-confirmed.event';
import { AdminOrderDetail } from './interfaces/admin-order.interface';

const mockAdminOrdersRepository = {
  findByIdForAdmin: jest.fn(),
  findAllWithFilters: jest.fn(),
  findByOrderNumberForAdmin: jest.fn(),
  updateStatus: jest.fn(),
};

const mockOrderStatusValidationService = {
  validateStatusTransition: jest.fn(),
};

const mockEventEmitter = {
  emit: jest.fn(),
};

const buildOrderDetail = (overrides: Partial<AdminOrderDetail> = {}): AdminOrderDetail => ({
  id: 'order-id-1',
  orderNumber: 'ORD-001',
  user: {
    id: 'user-id-1',
    email: 'test@snacks.com',
    firstName: 'Ana',
    lastName: 'Martinez',
  },
  items: [
    {
      id: 'item-id-1',
      product: { id: 'prod-1', name: 'Turrones', slug: 'turrones', sku: 'TUR-001' },
      quantity: 2,
      price: 400,
      subtotal: 800,
    },
  ],
  shippingAddress: {
    street: 'Lavalle 800',
    city: 'Córdoba',
    province: 'Córdoba',
    postalCode: 'X5000',
  },
  paymentMethod: 'efectivo',
  subtotal: 800,
  shipping: 150,
  total: 950,
  status: 'pending',
  createdAt: new Date('2024-05-01T09:00:00Z'),
  updatedAt: new Date('2024-05-01T09:00:00Z'),
  ...overrides,
});

describe('AdminOrdersService', () => {
  let service: AdminOrdersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminOrdersService,
        { provide: AdminOrdersRepository, useValue: mockAdminOrdersRepository },
        { provide: OrderStatusValidationService, useValue: mockOrderStatusValidationService },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get<AdminOrdersService>(AdminOrdersService);
    jest.clearAllMocks();
  });

  describe('updateStatus', () => {
    it('should emit order.confirmed event with OrderConfirmedEvent when status is confirmed', async () => {
      const originalOrder = buildOrderDetail({ status: 'pending' });
      const updatedOrder = buildOrderDetail({ status: 'confirmed' });

      mockAdminOrdersRepository.findByIdForAdmin.mockResolvedValue(originalOrder);
      mockOrderStatusValidationService.validateStatusTransition.mockReturnValue(undefined);
      mockAdminOrdersRepository.updateStatus.mockResolvedValue(updatedOrder);

      await service.updateStatus('order-id-1', { status: OrderStatus.confirmed });

      expect(mockEventEmitter.emit).toHaveBeenCalledTimes(1);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        EVENT_NAMES.order.confirmed,
        expect.any(OrderConfirmedEvent),
      );
    });

    it('should emit OrderConfirmedEvent with correct orderId, orderNumber, and orderDetail', async () => {
      const originalOrder = buildOrderDetail({ status: 'pending' });
      const updatedOrder = buildOrderDetail({ status: 'confirmed' });

      mockAdminOrdersRepository.findByIdForAdmin.mockResolvedValue(originalOrder);
      mockOrderStatusValidationService.validateStatusTransition.mockReturnValue(undefined);
      mockAdminOrdersRepository.updateStatus.mockResolvedValue(updatedOrder);

      await service.updateStatus('order-id-1', { status: OrderStatus.confirmed });

      const emittedEvent = mockEventEmitter.emit.mock.calls[0][1] as OrderConfirmedEvent;
      expect(emittedEvent.orderId).toBe('order-id-1');
      expect(emittedEvent.orderNumber).toBe('ORD-001');
      expect(emittedEvent.orderDetail).toEqual(updatedOrder);
    });

    it('should NOT emit order.confirmed event when status is shipped', async () => {
      const originalOrder = buildOrderDetail({ status: 'confirmed' });
      const updatedOrder = buildOrderDetail({ status: 'shipped' });

      mockAdminOrdersRepository.findByIdForAdmin.mockResolvedValue(originalOrder);
      mockOrderStatusValidationService.validateStatusTransition.mockReturnValue(undefined);
      mockAdminOrdersRepository.updateStatus.mockResolvedValue(updatedOrder);

      await service.updateStatus('order-id-1', { status: OrderStatus.shipped });

      expect(mockEventEmitter.emit).not.toHaveBeenCalledWith(
        EVENT_NAMES.order.confirmed,
        expect.anything(),
      );
    });

    it('should NOT emit order.confirmed event when status is delivered', async () => {
      const originalOrder = buildOrderDetail({ status: 'shipped' });
      const updatedOrder = buildOrderDetail({ status: 'delivered' });

      mockAdminOrdersRepository.findByIdForAdmin.mockResolvedValue(originalOrder);
      mockOrderStatusValidationService.validateStatusTransition.mockReturnValue(undefined);
      mockAdminOrdersRepository.updateStatus.mockResolvedValue(updatedOrder);

      await service.updateStatus('order-id-1', { status: OrderStatus.delivered });

      expect(mockEventEmitter.emit).not.toHaveBeenCalledWith(
        EVENT_NAMES.order.confirmed,
        expect.anything(),
      );
    });

    it('should NOT emit order.confirmed event when status is cancelled', async () => {
      const originalOrder = buildOrderDetail({ status: 'pending' });
      const updatedOrder = buildOrderDetail({ status: 'cancelled' });

      mockAdminOrdersRepository.findByIdForAdmin.mockResolvedValue(originalOrder);
      mockOrderStatusValidationService.validateStatusTransition.mockReturnValue(undefined);
      mockAdminOrdersRepository.updateStatus.mockResolvedValue(updatedOrder);

      await service.updateStatus('order-id-1', { status: OrderStatus.cancelled });

      expect(mockEventEmitter.emit).not.toHaveBeenCalledWith(
        EVENT_NAMES.order.confirmed,
        expect.anything(),
      );
    });

    it('should NOT emit any event when status is pending', async () => {
      const originalOrder = buildOrderDetail({ status: 'processing' });
      const updatedOrder = buildOrderDetail({ status: 'pending' });

      mockAdminOrdersRepository.findByIdForAdmin.mockResolvedValue(originalOrder);
      mockOrderStatusValidationService.validateStatusTransition.mockReturnValue(undefined);
      mockAdminOrdersRepository.updateStatus.mockResolvedValue(updatedOrder);

      await service.updateStatus('order-id-1', { status: OrderStatus.pending });

      expect(mockEventEmitter.emit).not.toHaveBeenCalled();
    });

    it('should return the updated order', async () => {
      const originalOrder = buildOrderDetail({ status: 'pending' });
      const updatedOrder = buildOrderDetail({ status: 'confirmed' });

      mockAdminOrdersRepository.findByIdForAdmin.mockResolvedValue(originalOrder);
      mockOrderStatusValidationService.validateStatusTransition.mockReturnValue(undefined);
      mockAdminOrdersRepository.updateStatus.mockResolvedValue(updatedOrder);

      const result = await service.updateStatus('order-id-1', { status: OrderStatus.confirmed });

      expect(result).toEqual(updatedOrder);
    });

    it('should call updateStatus with stock revert args when status is cancelled', async () => {
      const originalOrder = buildOrderDetail({ status: 'pending' });
      const updatedOrder = buildOrderDetail({ status: 'cancelled' });

      mockAdminOrdersRepository.findByIdForAdmin.mockResolvedValue(originalOrder);
      mockOrderStatusValidationService.validateStatusTransition.mockReturnValue(undefined);
      mockAdminOrdersRepository.updateStatus.mockResolvedValue(updatedOrder);

      await service.updateStatus('order-id-1', { status: OrderStatus.cancelled });

      expect(mockAdminOrdersRepository.updateStatus).toHaveBeenCalledWith(
        'order-id-1',
        OrderStatus.cancelled,
        'ORD-001',
        [{ productId: 'prod-1', quantity: 2 }],
      );
    });
  });
});
