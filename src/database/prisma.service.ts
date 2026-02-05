import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { LoggerService } from '../shared/logger/logger.service';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(private readonly logger: LoggerService) {
    const connectionString = process.env.DATABASE_URL ?? '';
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    super({ adapter });
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
