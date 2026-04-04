import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { CartModule } from '../cart/cart.module';
import { ShippingModule } from '../shipping/shipping.module';
import { OrdersRepository } from './orders.repository';
import { OrderCalculationService } from './services/order-calculation.service';
import { OrderValidationService } from './services/order-validation.service';
import { OrderNumberGeneratorService } from './services/order-number-generator.service';
import { StockManagementService } from './services/stock-management.service';
import { CartListener } from './listeners/cart.listener';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';

@Module({
  imports: [PrismaModule, CartModule, ShippingModule],
  controllers: [OrdersController],
  providers: [
    OrdersRepository,
    OrderCalculationService,
    OrderValidationService,
    OrderNumberGeneratorService,
    StockManagementService,
    CartListener,
    OrdersService,
  ],
  exports: [OrdersService],
})
export class OrdersModule {}
