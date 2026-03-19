import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../database/prisma.module';
import { AuthModule } from '../../auth/auth.module';
import { AdminOrdersController } from './admin-orders.controller';
import { AdminOrdersRepository } from './admin-orders.repository';
import { AdminOrdersService } from './admin-orders.service';
import { OrderStatusValidationService } from './services/order-status-validation.service';
import { OrderSummaryService } from './services/order-summary.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [AdminOrdersController],
  providers: [
    AdminOrdersRepository,
    OrderStatusValidationService,
    OrderSummaryService,
    AdminOrdersService,
  ],
  exports: [AdminOrdersService],
})
export class AdminOrdersModule {}
