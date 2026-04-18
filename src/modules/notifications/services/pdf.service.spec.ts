import { Test, TestingModule } from '@nestjs/testing';
import { PdfService } from './pdf.service';
import { LoggerService } from '../../../shared/logger/logger.service';
import { AdminOrderDetail } from '../../admin/admin-orders/interfaces/admin-order.interface';

const mockLoggerService = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};

const buildOrder = (overrides: Partial<AdminOrderDetail> = {}): AdminOrderDetail => ({
  id: 'order-id-1',
  orderNumber: 'ORD-001',
  user: {
    id: 'user-id-1',
    email: 'test@example.com',
    firstName: 'Juan',
    lastName: 'Perez',
  },
  items: [
    {
      id: 'item-id-1',
      product: { id: 'prod-id-1', name: 'Papas Fritas', slug: 'papas-fritas', sku: 'SKU-001' },
      quantity: 2,
      price: 500,
      subtotal: 1000,
    },
  ],
  shippingAddress: {
    street: 'Av. Corrientes 1234',
    city: 'Buenos Aires',
    province: 'CABA',
    postalCode: 'C1043',
    phone: '011-1234-5678',
  },
  paymentMethod: 'mercado_pago',
  subtotal: 1000,
  shipping: 200,
  total: 1200,
  status: 'confirmed',
  createdAt: new Date('2024-01-15T10:00:00Z'),
  updatedAt: new Date('2024-01-15T10:05:00Z'),
  ...overrides,
});

describe('PdfService', () => {
  let service: PdfService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PdfService, { provide: LoggerService, useValue: mockLoggerService }],
    }).compile();

    service = module.get<PdfService>(PdfService);
    jest.clearAllMocks();
  });

  describe('generateRemito', () => {
    it('should return a Buffer', async () => {
      const result = await service.generateRemito(buildOrder());

      expect(result).toBeInstanceOf(Buffer);
    });

    it('should return a Buffer starting with %PDF', async () => {
      const result = await service.generateRemito(buildOrder());

      expect(result.slice(0, 4).toString()).toBe('%PDF');
    });

    it('should generate PDF with 1 item', async () => {
      const order = buildOrder();

      const result = await service.generateRemito(order);

      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should generate PDF with 3 items', async () => {
      const order = buildOrder({
        items: [
          {
            id: 'item-1',
            product: { id: 'p1', name: 'Papas Fritas', slug: 'papas', sku: 'SKU-001' },
            quantity: 1,
            price: 500,
            subtotal: 500,
          },
          {
            id: 'item-2',
            product: { id: 'p2', name: 'Galletitas Oreo', slug: 'oreo', sku: 'SKU-002' },
            quantity: 3,
            price: 300,
            subtotal: 900,
          },
          {
            id: 'item-3',
            product: { id: 'p3', name: 'Maní Frito', slug: 'mani', sku: 'SKU-003' },
            quantity: 2,
            price: 400,
            subtotal: 800,
          },
        ],
        subtotal: 2200,
        total: 2400,
      });

      const result = await service.generateRemito(order);

      expect(result).toBeInstanceOf(Buffer);
      expect(result.slice(0, 4).toString()).toBe('%PDF');
    });

    it('should generate PDF with 20 items (large order)', async () => {
      const items = Array.from({ length: 20 }, (_, i) => ({
        id: `item-${i}`,
        product: {
          id: `prod-${i}`,
          name: `Producto ${i + 1}`,
          slug: `producto-${i}`,
          sku: `SKU-${String(i).padStart(3, '0')}`,
        },
        quantity: i + 1,
        price: 100 * (i + 1),
        subtotal: 100 * (i + 1) * (i + 1),
      }));

      const order = buildOrder({
        items,
        subtotal: items.reduce((s, i) => s + i.subtotal, 0),
        total: items.reduce((s, i) => s + i.subtotal, 0) + 200,
      });

      const result = await service.generateRemito(order);

      expect(result).toBeInstanceOf(Buffer);
      expect(result.slice(0, 4).toString()).toBe('%PDF');
    });

    it('should handle missing shipping address fields gracefully', async () => {
      const order = buildOrder({ shippingAddress: {} });

      const result = await service.generateRemito(order);

      expect(result).toBeInstanceOf(Buffer);
      expect(result.slice(0, 4).toString()).toBe('%PDF');
    });

    it('should handle partial shipping address (only city)', async () => {
      const order = buildOrder({ shippingAddress: { city: 'Rosario' } });

      const result = await service.generateRemito(order);

      expect(result).toBeInstanceOf(Buffer);
      expect(result.slice(0, 4).toString()).toBe('%PDF');
    });

    it('should handle alternative address field names (address / state / zipCode)', async () => {
      const order = buildOrder({
        shippingAddress: {
          address: 'Calle Falsa 123',
          state: 'Santa Fe',
          zipCode: '2000',
          phone: '341-555-0000',
        },
      });

      const result = await service.generateRemito(order);

      expect(result).toBeInstanceOf(Buffer);
      expect(result.slice(0, 4).toString()).toBe('%PDF');
    });
  });
});
