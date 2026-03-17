import { Controller, Get, Param, ParseUUIDPipe, Query, Req } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { UserWithoutPassword } from '../users/interfaces/user-without-password.interface';
import { CategoriesService } from './categories.service';
import { CategoryQueryDto } from './dto/category-query.dto';

@ApiTags('categories')
@Public()
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar categorías',
    description:
      'Retorna categorías en estructura jerárquica (por defecto) o como lista plana si flat=true. ' +
      'Admins pueden usar includeInactive=true para ver categorías inactivas.',
  })
  @ApiResponse({ status: 200, description: 'Listado de categorías' })
  async findAll(@Query() query: CategoryQueryDto, @Req() req: Request) {
    const user = req.user as UserWithoutPassword | undefined;
    const isAdmin = user?.role === 'admin';
    // Solo admins pueden ver inactivas; público siempre ve solo activas
    const filters = { includeInactive: isAdmin ? query.includeInactive : false };
    if (query.flat) {
      return this.categoriesService.findAllFlat(filters);
    }
    return this.categoriesService.findAll(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener categoría por ID con sus hijos' })
  @ApiParam({ name: 'id', description: 'UUID de la categoría' })
  @ApiResponse({ status: 200, description: 'Categoría con hijos directos' })
  @ApiResponse({ status: 404, description: 'Categoría no encontrada' })
  async findById(@Param('id', ParseUUIDPipe) id: string, @Req() req: Request) {
    const user = req.user as UserWithoutPassword | undefined;
    return this.categoriesService.findById(id, user?.role === 'admin');
  }
}
