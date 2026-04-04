import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ShippingCalculationService } from './services/shipping-calculation.service';
import { ShippingService } from './shipping.service';
import { ShippingController } from './shipping.controller';

@Module({
  imports: [ConfigModule],
  controllers: [ShippingController],
  providers: [ShippingCalculationService, ShippingService],
  exports: [ShippingService],
})
export class ShippingModule {}
