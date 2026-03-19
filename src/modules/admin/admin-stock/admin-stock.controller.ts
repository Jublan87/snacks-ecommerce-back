import { Controller, Get, Param, ParseUUIDPipe, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { THROTTLE_OPTIONS } from '../../../common/constants/throttler.constants';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { AdminStockService } from './admin-stock.service';
import { StockHistoryQueryDto } from './dto/stock-history-query.dto';

@ApiTags('admin-stock')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Throttle({ admin: THROTTLE_OPTIONS.admin })
@Controller('admin/stock')
export class AdminStockController {
  constructor(private readonly adminStockService: AdminStockService) {}

  @Get('history')
  @ApiOperation({ summary: 'Obtener historial de stock de todos los productos' })
  @ApiResponse({ status: 200, description: 'Historial de stock obtenido exitosamente' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Sin permisos de admin' })
  findAll(@Query() query: StockHistoryQueryDto) {
    return this.adminStockService.findAll(query);
  }

  @Get('history/:productId')
  @ApiOperation({ summary: 'Obtener historial de stock de un producto' })
  @ApiParam({ name: 'productId', description: 'ID del producto', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Historial de stock del producto obtenido exitosamente' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Sin permisos de admin' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  findByProductId(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Query() query: StockHistoryQueryDto,
  ) {
    return this.adminStockService.findByProductId(productId, query);
  }
}
