import { Body, Controller, Get, Param, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { THROTTLE_OPTIONS } from '../../../common/constants/throttler.constants';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { AdminOrdersService } from './admin-orders.service';
import { AdminOrderQueryDto } from './dto/admin-order-query.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@ApiTags('admin-orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Throttle({ admin: THROTTLE_OPTIONS.admin })
@Controller('admin/orders')
export class AdminOrdersController {
  constructor(private readonly adminOrdersService: AdminOrdersService) {}

  @Get('number/:orderNumber')
  @ApiOperation({ summary: 'Buscar orden por número de orden' })
  @ApiResponse({ status: 200, description: 'Orden encontrada' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Sin permisos de admin' })
  @ApiResponse({ status: 404, description: 'Orden no encontrada' })
  findByOrderNumber(@Param('orderNumber') orderNumber: string) {
    return this.adminOrdersService.findByOrderNumber(orderNumber);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas las órdenes con filtros' })
  @ApiResponse({ status: 200, description: 'Listado de órdenes paginado' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Sin permisos de admin' })
  findAll(@Query() query: AdminOrderQueryDto) {
    return this.adminOrdersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener orden por ID' })
  @ApiResponse({ status: 200, description: 'Orden encontrada' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Sin permisos de admin' })
  @ApiResponse({ status: 404, description: 'Orden no encontrada' })
  findById(@Param('id') id: string) {
    return this.adminOrdersService.findById(id);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Actualizar estado de la orden' })
  @ApiResponse({ status: 200, description: 'Estado actualizado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Sin permisos de admin' })
  @ApiResponse({ status: 404, description: 'Orden no encontrada' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.adminOrdersService.updateStatus(id, dto);
  }
}
