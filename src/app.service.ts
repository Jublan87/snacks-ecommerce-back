import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HealthCheckService, HealthCheckError, MemoryHealthIndicator } from '@nestjs/terminus';
import { Prisma } from '@prisma/client';
import { name, version } from '../package.json';
import { PrismaService } from './database/prisma.service';

@Injectable()
export class AppService {
  constructor(
    private readonly health: HealthCheckService,
    private readonly memory: MemoryHealthIndicator,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async getHealth() {
    const result = await this.health.check([
      async () => {
        try {
          await this.prisma.$queryRaw(Prisma.sql`SELECT 1`);
          return { database: { status: 'up' as const } };
        } catch {
          throw new HealthCheckError('Database check failed', {
            database: { status: 'down' as const },
          });
        }
      },
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
    ]);

    return {
      ...result,
      appInfo: {
        name,
        version,
        environment: this.config.get<string>('app.nodeEnv', 'development'),
        uptime: Math.floor(process.uptime()),
      },
    };
  }
}
