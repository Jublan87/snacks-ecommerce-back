import { Test, TestingModule } from '@nestjs/testing';
import { TelegramService } from './telegram.service';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../../../shared/logger/logger.service';
import { AdminOrderDetail } from '../../admin/admin-orders/interfaces/admin-order.interface';

const mockLoggerService = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};

const mockConfigService = {
  get: jest.fn(),
};

const mockOrder: AdminOrderDetail = {
  id: 'order-id-1',
  orderNumber: 'ORD-001',
  user: {
    id: 'user-id-1',
    email: 'test@example.com',
    firstName: 'Maria',
    lastName: 'Garcia',
  },
  items: [
    {
      id: 'item-id-1',
      product: { id: 'prod-1', name: 'Papas Fritas', slug: 'papas-fritas', sku: 'SKU-001' },
      quantity: 2,
      price: 500,
      subtotal: 1000,
    },
  ],
  shippingAddress: { street: 'Av. Rivadavia 100', city: 'Buenos Aires' },
  paymentMethod: 'mercado_pago',
  subtotal: 1000,
  shipping: 200,
  total: 1200,
  status: 'confirmed',
  createdAt: new Date('2024-01-15T10:00:00Z'),
  updatedAt: new Date('2024-01-15T10:05:00Z'),
};

const mockPdfBuffer = Buffer.from('%PDF-1.4 mock pdf content');

describe('TelegramService', () => {
  let service: TelegramService;
  let fetchSpy: jest.SpyInstance;

  beforeEach(async () => {
    mockConfigService.get.mockImplementation((key: string) => {
      if (key === 'telegram.botToken') return 'test-bot-token-123';
      if (key === 'telegram.chatId') return 'group-chat-456';
      return undefined;
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TelegramService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: LoggerService, useValue: mockLoggerService },
      ],
    }).compile();

    service = module.get<TelegramService>(TelegramService);

    fetchSpy = jest.spyOn(globalThis as typeof globalThis & { fetch: typeof fetch }, 'fetch');
    jest.clearAllMocks();
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  describe('constructor', () => {
    it('should warn when TELEGRAM_BOT_TOKEN is not configured', async () => {
      mockConfigService.get.mockReturnValue(undefined);

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          TelegramService,
          { provide: ConfigService, useValue: mockConfigService },
          { provide: LoggerService, useValue: mockLoggerService },
        ],
      }).compile();

      module.get<TelegramService>(TelegramService);

      expect(mockLoggerService.warn).toHaveBeenCalledWith(
        'TELEGRAM_BOT_TOKEN is not configured — Telegram notifications are disabled',
        'TelegramService',
      );
    });

    it('should warn when TELEGRAM_ADMIN_CHAT_ID is not configured', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'telegram.botToken') return 'test-bot-token-123';
        return undefined;
      });

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          TelegramService,
          { provide: ConfigService, useValue: mockConfigService },
          { provide: LoggerService, useValue: mockLoggerService },
        ],
      }).compile();

      module.get<TelegramService>(TelegramService);

      expect(mockLoggerService.warn).toHaveBeenCalledWith(
        'TELEGRAM_CHAT_ID is not configured — Telegram notifications are disabled',
        'TelegramService',
      );
    });
  });

  describe('sendToAllAdmins', () => {
    it('should call fetch once with the group chat ID', async () => {
      (global.fetch as jest.Mock) = jest.fn().mockResolvedValue({ ok: true });

      await service.sendToAllAdmins(mockPdfBuffer, mockOrder);

      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should call fetch with correct Telegram API URL', async () => {
      const fetchMock = jest.fn().mockResolvedValue({ ok: true });
      (global.fetch as jest.Mock) = fetchMock;

      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'telegram.botToken') return 'test-bot-token-123';
        if (key === 'telegram.chatId') return 'group-chat-456';
        return undefined;
      });

      const module = await Test.createTestingModule({
        providers: [
          TelegramService,
          { provide: ConfigService, useValue: mockConfigService },
          { provide: LoggerService, useValue: mockLoggerService },
        ],
      }).compile();
      const svc = module.get<TelegramService>(TelegramService);

      await svc.sendToAllAdmins(mockPdfBuffer, mockOrder);

      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.telegram.org/bottest-bot-token-123/sendDocument',
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('should return early without calling fetch when adminChatId is not configured', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'telegram.botToken') return 'test-bot-token-123';
        return undefined;
      });

      const module = await Test.createTestingModule({
        providers: [
          TelegramService,
          { provide: ConfigService, useValue: mockConfigService },
          { provide: LoggerService, useValue: mockLoggerService },
        ],
      }).compile();
      const svc = module.get<TelegramService>(TelegramService);

      const fetchMock = jest.fn();
      (global.fetch as jest.Mock) = fetchMock;
      jest.clearAllMocks();

      await svc.sendToAllAdmins(mockPdfBuffer, mockOrder);

      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('should return early without calling fetch when bot token is not configured', async () => {
      mockConfigService.get.mockReturnValue(undefined);

      const module = await Test.createTestingModule({
        providers: [
          TelegramService,
          { provide: ConfigService, useValue: mockConfigService },
          { provide: LoggerService, useValue: mockLoggerService },
        ],
      }).compile();
      const svc = module.get<TelegramService>(TelegramService);

      const fetchMock = jest.fn();
      (global.fetch as jest.Mock) = fetchMock;
      jest.clearAllMocks();

      await svc.sendToAllAdmins(mockPdfBuffer, mockOrder);

      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('should retry once when first fetch fails (ok: false) and second succeeds', async () => {
      jest.useFakeTimers();

      const fetchMock = jest
        .fn()
        .mockResolvedValueOnce({ ok: false })
        .mockResolvedValueOnce({ ok: true });
      (global.fetch as jest.Mock) = fetchMock;

      const sendPromise = service.sendToAllAdmins(mockPdfBuffer, mockOrder);
      await jest.runAllTimersAsync();
      await sendPromise;

      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(mockLoggerService.warn).toHaveBeenCalledWith(
        'First Telegram send attempt failed, retrying in 2s',
        'TelegramService',
        { chatId: 'group-chat-456' },
      );
      expect(mockLoggerService.error).not.toHaveBeenCalled();

      jest.useRealTimers();
    });

    it('should log error and not throw when both retry attempts fail', async () => {
      jest.useFakeTimers();

      const fetchMock = jest
        .fn()
        .mockResolvedValueOnce({ ok: false })
        .mockResolvedValueOnce({ ok: false });
      (global.fetch as jest.Mock) = fetchMock;

      const sendPromise = service.sendToAllAdmins(mockPdfBuffer, mockOrder);
      await jest.runAllTimersAsync();
      await sendPromise;

      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(mockLoggerService.error).toHaveBeenCalledWith(
        'Failed to send Telegram notification to admin after retry',
        'TelegramService',
        expect.objectContaining({ chatId: 'group-chat-456' }),
      );

      jest.useRealTimers();
    });

    it('should log error and not throw when fetch throws on both attempts', async () => {
      jest.useFakeTimers();

      const fetchMock = jest.fn().mockRejectedValue(new Error('Network error'));
      (global.fetch as jest.Mock) = fetchMock;

      const sendPromise = service.sendToAllAdmins(mockPdfBuffer, mockOrder);
      await jest.runAllTimersAsync();

      await expect(sendPromise).resolves.toBeUndefined();
      expect(mockLoggerService.error).toHaveBeenCalled();

      jest.useRealTimers();
    });
  });
});
