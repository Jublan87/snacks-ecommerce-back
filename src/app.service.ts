import { Injectable } from '@nestjs/common';
import { LoggerService } from './shared/logger/logger.service';

@Injectable()
export class AppService {
  constructor(private readonly logger: LoggerService) {}

  getHello(): string {
    this.logger.info('Solicitud a raíz de la API', 'AppService');
    return 'Bienvenido a la API de Snacks E-commerce!';
  }
}
