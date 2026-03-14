import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
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
    LoggerModule,
    PrismaModule,
    AuthModule,
    CategoriesModule,
    ProductsModule,
    CartModule,
    ShippingModule,
    OrdersModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
