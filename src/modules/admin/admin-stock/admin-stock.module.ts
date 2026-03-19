import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../database/prisma.module';
import { AuthModule } from '../../auth/auth.module';
import { AdminStockController } from './admin-stock.controller';
import { AdminStockRepository } from './admin-stock.repository';
import { AdminStockService } from './admin-stock.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [AdminStockController],
  providers: [AdminStockRepository, AdminStockService],
  exports: [AdminStockService],
})
export class AdminStockModule {}
