import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { AdminStockService } from './admin-stock.service';
import { StockHistoryQueryDto } from './dto/stock-history-query.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/stock')
export class AdminStockController {
  constructor(private readonly adminStockService: AdminStockService) {}

  @Get('history')
  findAll(@Query() query: StockHistoryQueryDto) {
    return this.adminStockService.findAll(query);
  }

  @Get('history/:productId')
  findByProductId(@Param('productId') productId: string, @Query() query: StockHistoryQueryDto) {
    return this.adminStockService.findByProductId(productId, query);
  }
}
