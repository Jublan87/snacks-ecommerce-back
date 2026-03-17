import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { AdminSharedModule } from '../shared/admin-shared.module';
import { AdminProductsController } from './admin-products.controller';
import { AdminProductsRepository } from './admin-products.repository';
import { AdminProductsService } from './admin-products.service';

@Module({
  imports: [AdminSharedModule, AuthModule],
  controllers: [AdminProductsController],
  providers: [AdminProductsRepository, AdminProductsService],
})
export class AdminProductsModule {}
