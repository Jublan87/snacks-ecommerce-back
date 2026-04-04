import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SessionUser } from '../auth/interfaces/session-user.interface';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderQueryDto } from './dto/order-query.dto';

@ApiTags('Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // IMPORTANTE: rutas literales antes de rutas con parámetro
  @Get('number/:orderNumber')
  @ApiOperation({ summary: 'Obtener pedido por número de orden' })
  @ApiParam({ name: 'orderNumber', description: 'Número de orden (ej: ORD-2024-0115-143025-001)' })
  @ApiResponse({ status: 200, description: 'Pedido encontrado' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Pedido no pertenece al usuario' })
  @ApiResponse({ status: 404, description: 'Pedido no encontrado' })
  async getOrderByNumber(
    @CurrentUser() user: SessionUser,
    @Param('orderNumber') orderNumber: string,
  ) {
    return this.ordersService.getOrderByNumber(user.id, orderNumber);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear pedido' })
  @ApiResponse({ status: 201, description: 'Pedido creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Stock insuficiente o producto inactivo' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async createOrder(@CurrentUser() user: SessionUser, @Body() dto: CreateOrderDto) {
    return this.ordersService.createOrder(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar pedidos del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Lista de pedidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async getOrders(@CurrentUser() user: SessionUser, @Query() query: OrderQueryDto) {
    return this.ordersService.getOrders(user.id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener pedido por ID' })
  @ApiParam({ name: 'id', description: 'UUID del pedido', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Pedido encontrado' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Pedido no pertenece al usuario' })
  @ApiResponse({ status: 404, description: 'Pedido no encontrado' })
  async getOrderById(@CurrentUser() user: SessionUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.ordersService.getOrderById(user.id, id);
  }
}
