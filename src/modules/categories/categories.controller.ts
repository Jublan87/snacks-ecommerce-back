import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
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
      'Retorna categorías en estructura jerárquica (por defecto) o como lista plana si flat=true.',
  })
  @ApiResponse({ status: 200, description: 'Listado de categorías' })
  async findAll(@Query() query: CategoryQueryDto) {
    const filters = { includeInactive: query.includeInactive };
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
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.categoriesService.findById(id);
  }
}
