import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { CartRepository } from './cart.repository';
import { CartValidationService } from './services/cart-validation.service';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';

@Module({
  imports: [PrismaModule],
  controllers: [CartController],
  providers: [CartRepository, CartValidationService, CartService],
  exports: [CartService],
})
export class CartModule {}
