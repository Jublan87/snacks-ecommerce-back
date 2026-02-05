import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { LoggerService } from '../shared/logger/logger.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(
    private readonly logger: LoggerService,
    private readonly configService: ConfigService,
  ) {
    const connectionString = process.env.DATABASE_URL ?? '';
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);

    // Configurar logging de queries en desarrollo
    const isDevelopment = configService.get('app.nodeEnv') === 'development';

    super({
      adapter,
      log: isDevelopment
        ? [
            { emit: 'event', level: 'query' },
            { emit: 'event', level: 'error' },
            { emit: 'event', level: 'info' },
            { emit: 'event', level: 'warn' },
          ]
        : [{ emit: 'event', level: 'error' }],
    });

    // Escuchar eventos de query en desarrollo
    if (isDevelopment) {
      this.$on('query' as never, (e: any) => {
        this.logger.debug(`Query: ${e.query}`, 'PrismaService');
        this.logger.debug(`Params: ${e.params}`, 'PrismaService');
        this.logger.debug(`Duration: ${e.duration}ms`, 'PrismaService');
      });
    }

    this.$on('error' as never, (e: any) => {
      this.logger.error(`Prisma error: ${e.message}`, 'PrismaService', e);
    });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.info('Conexión a base de datos establecida', 'PrismaService');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.info('Conexión a base de datos cerrada', 'PrismaService');
  }
}
