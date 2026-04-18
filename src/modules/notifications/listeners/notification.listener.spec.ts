import { Test, TestingModule } from '@nestjs/testing';
import { NotificationListener } from './notification.listener';
import { PdfService } from '../services/pdf.service';
import { TelegramService } from '../services/telegram.service';
import { LoggerService } from '../../../shared/logger/logger.service';
import { OrderConfirmedEvent } from '../../orders/events/order-confirmed.event';
import { AdminOrderDetail } from '../../admin/admin-orders/interfaces/admin-order.interface';

const mockPdfService = {
  generateRemito: jest.fn(),
};

const mockTelegramService = {
  sendToAllAdmins: jest.fn(),
};

const mockLoggerService = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};

const mockOrderDetail: AdminOrderDetail = {
  id: 'order-id-1',
  orderNumber: 'ORD-001',
  user: {
    id: 'user-id-1',
    email: 'cliente@example.com',
    firstName: 'Carlos',
    lastName: 'Lopez',
  },
  items: [
    {
      id: 'item-id-1',
      product: { id: 'prod-1', name: 'Alfajores', slug: 'alfajores', sku: 'ALF-001' },
      quantity: 3,
      price: 250,
      subtotal: 750,
    },
  ],
  shippingAddress: { street: 'Belgrano 500', city: 'Mendoza', province: 'Mendoza' },
  paymentMethod: 'transferencia',
  subtotal: 750,
  shipping: 150,
  total: 900,
  status: 'confirmed',
  createdAt: new Date('2024-03-10T12:00:00Z'),
  updatedAt: new Date('2024-03-10T12:01:00Z'),
};

const mockPdfBuffer = Buffer.from('%PDF-1.4 mock');

describe('NotificationListener', () => {
  let listener: NotificationListener;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationListener,
        { provide: PdfService, useValue: mockPdfService },
        { provide: TelegramService, useValue: mockTelegramService },
        { provide: LoggerService, useValue: mockLoggerService },
      ],
    }).compile();

    listener = module.get<NotificationListener>(NotificationListener);

    mockPdfService.generateRemito.mockResolvedValue(mockPdfBuffer);
    mockTelegramService.sendToAllAdmins.mockResolvedValue(undefined);

    jest.clearAllMocks();

    // Restore defaults after clearAllMocks
    mockPdfService.generateRemito.mockResolvedValue(mockPdfBuffer);
    mockTelegramService.sendToAllAdmins.mockResolvedValue(undefined);
  });

  describe('handleOrderConfirmed', () => {
    it('should return void synchronously (not a Promise)', () => {
      const event = new OrderConfirmedEvent('order-id-1', 'ORD-001', mockOrderDetail);

      const result = listener.handleOrderConfirmed(event);

      expect(result).toBeUndefined();
    });

    it('should call pdfService.generateRemito with the order detail', async () => {
      const event = new OrderConfirmedEvent('order-id-1', 'ORD-001', mockOrderDetail);

      listener.handleOrderConfirmed(event);

      // Flush the void async internal promise
      await new Promise(process.nextTick);

      expect(mockPdfService.generateRemito).toHaveBeenCalledTimes(1);
      expect(mockPdfService.generateRemito).toHaveBeenCalledWith(mockOrderDetail);
    });

    it('should call telegramService.sendToAllAdmins with the pdf buffer and order detail', async () => {
      const event = new OrderConfirmedEvent('order-id-1', 'ORD-001', mockOrderDetail);

      listener.handleOrderConfirmed(event);
      await new Promise(process.nextTick);

      expect(mockTelegramService.sendToAllAdmins).toHaveBeenCalledTimes(1);
      expect(mockTelegramService.sendToAllAdmins).toHaveBeenCalledWith(
        mockPdfBuffer,
        mockOrderDetail,
      );
    });

    it('should log success info after sending notification', async () => {
      const event = new OrderConfirmedEvent('order-id-1', 'ORD-001', mockOrderDetail);

      listener.handleOrderConfirmed(event);
      await new Promise(process.nextTick);

      expect(mockLoggerService.info).toHaveBeenCalledWith(
        'Notification sent for order #ORD-001',
        'NotificationListener',
        { orderId: 'order-id-1' },
      );
    });

    it('should not throw when pdfService.generateRemito throws', async () => {
      mockPdfService.generateRemito.mockRejectedValue(new Error('PDF generation failed'));

      const event = new OrderConfirmedEvent('order-id-1', 'ORD-001', mockOrderDetail);

      expect(() => listener.handleOrderConfirmed(event)).not.toThrow();
      await new Promise(process.nextTick);

      expect(mockLoggerService.error).toHaveBeenCalledWith(
        'Failed to send order confirmed notification',
        'NotificationListener',
        expect.objectContaining({ orderId: 'order-id-1', orderNumber: 'ORD-001' }),
      );
    });

    it('should not throw when telegramService.sendToAllAdmins throws', async () => {
      mockTelegramService.sendToAllAdmins.mockRejectedValue(new Error('Telegram API error'));

      const event = new OrderConfirmedEvent('order-id-1', 'ORD-001', mockOrderDetail);

      expect(() => listener.handleOrderConfirmed(event)).not.toThrow();
      await new Promise(process.nextTick);

      expect(mockLoggerService.error).toHaveBeenCalledWith(
        'Failed to send order confirmed notification',
        'NotificationListener',
        expect.objectContaining({ error: 'Telegram API error' }),
      );
    });

    it('should not call telegramService if pdfService throws', async () => {
      mockPdfService.generateRemito.mockRejectedValue(new Error('PDF failed'));

      const event = new OrderConfirmedEvent('order-id-1', 'ORD-001', mockOrderDetail);

      listener.handleOrderConfirmed(event);
      await new Promise(process.nextTick);

      expect(mockTelegramService.sendToAllAdmins).not.toHaveBeenCalled();
    });
  });
});
