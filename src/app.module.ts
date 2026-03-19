import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TerminusModule } from '@nestjs/terminus';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { THROTTLE_MODULE_LIMITS } from './common/constants/throttler.constants';
import { PrismaModule } from './database/prisma.module';
import { LoggerModule } from './shared/logger/logger.module';
import { validationSchema } from './config/validation.schema';
import configuration from './config/configuration';
import { AuthModule } from './modules/auth/auth.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ProductsModule } from './modules/products/products.module';
import { CartModule } from './modules/cart/cart.module';
import { ShippingModule } from './modules/shipping/shipping.module';
import { OrdersModule } from './modules/orders/orders.module';
import { AdminProductsModule } from './modules/admin/admin-products/admin-products.module';
import { AdminCategoriesModule } from './modules/admin/admin-categories/admin-categories.module';
import { AdminOrdersModule } from './modules/admin/admin-orders/admin-orders.module';
import { AdminStockModule } from './modules/admin/admin-stock/admin-stock.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema,
      load: [configuration],
      validationOptions: {
        allowUnknown: true,
        abortEarly: false,
      },
    }),
    EventEmitterModule.forRoot({
      wildcard: true,
      delimiter: '.',
    }),
    ThrottlerModule.forRoot(THROTTLE_MODULE_LIMITS),
    TerminusModule,
    LoggerModule,
    PrismaModule,
    AuthModule,
    CategoriesModule,
    ProductsModule,
    CartModule,
    ShippingModule,
    OrdersModule,
    AdminProductsModule,
    AdminCategoriesModule,
    AdminOrdersModule,
    AdminStockModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
