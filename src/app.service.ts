import { Injectable } from '@nestjs/common';
import { name, version } from '../package.json';
import { LoggerService } from './shared/logger/logger.service';

@Injectable()
export class AppService {
  constructor(private readonly logger: LoggerService) {}

  getHealth() {
    return {
      status: 'ok',
      name,
      version,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
