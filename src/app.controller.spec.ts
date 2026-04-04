import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

const mockHealthResponse = {
  status: 'ok',
  name: 'snacks-ecommerce-back',
  version: '1.0.0',
  timestamp: '2024-01-01T00:00:00.000Z',
  uptime: 123.45,
};

describe('AppController', () => {
  let appController: AppController;
  let appService: jest.Mocked<AppService>;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: { getHealth: jest.fn().mockReturnValue(mockHealthResponse) },
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
    appService = app.get(AppService);
  });

  describe('getHealth', () => {
    it('should return the health response from AppService', () => {
      const result = appController.getHealth();

      expect(result).toEqual(mockHealthResponse);
    });

    it('should delegate to AppService.getHealth', () => {
      appController.getHealth();

      expect(appService.getHealth).toHaveBeenCalledTimes(1);
    });
  });
});
