import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { AdminSharedModule } from '../shared/admin-shared.module';
import { AdminCategoriesController } from './admin-categories.controller';
import { AdminCategoriesRepository } from './admin-categories.repository';
import { AdminCategoriesService } from './admin-categories.service';

@Module({
  imports: [AdminSharedModule, AuthModule],
  controllers: [AdminCategoriesController],
  providers: [AdminCategoriesRepository, AdminCategoriesService],
})
export class AdminCategoriesModule {}
