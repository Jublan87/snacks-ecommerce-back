import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SessionUser } from '../auth/interfaces/session-user.interface';
import { AddressesService } from './addresses.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@ApiTags('Addresses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users/me/addresses')
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar direcciones del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Lista de direcciones' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async findAll(@CurrentUser() user: SessionUser) {
    return this.addressesService.findAll(user.id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear una nueva dirección' })
  @ApiResponse({ status: 201, description: 'Dirección creada' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async create(@CurrentUser() user: SessionUser, @Body() dto: CreateAddressDto) {
    return this.addressesService.create(user.id, dto);
  }

  // IMPORTANTE: ruta literal /:id/default ANTES de las rutas con parámetro /:id
  @Post(':id/default')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Establecer una dirección como predeterminada' })
  @ApiParam({ name: 'id', description: 'UUID de la dirección', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Dirección establecida como predeterminada' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Dirección no pertenece al usuario' })
  @ApiResponse({ status: 404, description: 'Dirección no encontrada' })
  async setDefault(@CurrentUser() user: SessionUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.addressesService.setDefault(user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una dirección existente' })
  @ApiParam({ name: 'id', description: 'UUID de la dirección', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Dirección actualizada' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Dirección no pertenece al usuario' })
  @ApiResponse({ status: 404, description: 'Dirección no encontrada' })
  async update(
    @CurrentUser() user: SessionUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAddressDto,
  ) {
    return this.addressesService.update(user.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una dirección' })
  @ApiParam({ name: 'id', description: 'UUID de la dirección', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Dirección eliminada' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Dirección no pertenece al usuario' })
  @ApiResponse({ status: 404, description: 'Dirección no encontrada' })
  async delete(@CurrentUser() user: SessionUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.addressesService.delete(user.id, id);
  }
}
