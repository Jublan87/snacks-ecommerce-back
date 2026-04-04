import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { ProductsRepository } from './products.repository';
import { ProductSearchService } from './services/product-search.service';
import { ProductPricingService } from './services/product-pricing.service';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';

@Module({
  imports: [PrismaModule],
  controllers: [ProductsController],
  providers: [ProductsRepository, ProductSearchService, ProductPricingService, ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
