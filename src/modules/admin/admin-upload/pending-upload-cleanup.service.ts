import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../../database/prisma.service';
import { IMAGE_STORAGE_ADAPTER, ImageStorageAdapter } from './interfaces/image-storage.interface';

@Injectable()
export class PendingUploadCleanupService {
  private readonly logger = new Logger(PendingUploadCleanupService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(IMAGE_STORAGE_ADAPTER)
    private readonly storageAdapter: ImageStorageAdapter,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleCleanupCron(): Promise<void> {
    this.logger.log('Running scheduled pending upload cleanup...');
    await this.cleanup();
  }

  async cleanup(maxAgeMinutes = 60): Promise<{ deleted: number; failed: number }> {
    const cutoff = new Date(Date.now() - maxAgeMinutes * 60 * 1000);

    const pending = await this.prisma.pendingUpload.findMany({
      where: { createdAt: { lt: cutoff } },
    });

    if (pending.length === 0) {
      return { deleted: 0, failed: 0 };
    }

    this.logger.log(`Found ${pending.length} orphaned uploads older than ${maxAgeMinutes}min`);

    let deleted = 0;
    let failed = 0;

    for (const upload of pending) {
      try {
        await this.storageAdapter.delete(upload.storageKey);
        await this.prisma.pendingUpload.delete({ where: { id: upload.id } });
        deleted++;
      } catch {
        this.logger.warn(`Failed to clean up ${upload.storageKey}`);
        failed++;
      }
    }

    this.logger.log(`Cleanup complete: ${deleted} deleted, ${failed} failed`);
    return { deleted, failed };
  }
}
