import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { ProductsService } from './products.service';
import { ProductSearchService } from './services/product-search.service';
import { ProductQueryDto } from './dto/product-query.dto';

@ApiTags('products')
@Public()
@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly productSearchService: ProductSearchService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Listar productos',
    description: 'Listado paginado de productos activos con soporte de filtros y ordenamiento.',
  })
  @ApiResponse({ status: 200, description: 'Listado paginado de productos con metadata' })
  async findAll(@Query() query: ProductQueryDto) {
    const categoryIds = this.productSearchService.parseCategoryParam(query.category);
    return this.productsService.findAll({
      search: query.search,
      categoryIds: categoryIds.length > 0 ? categoryIds : undefined,
      minPrice: query.minPrice,
      maxPrice: query.maxPrice,
      inStock: query.inStock,
      isFeatured: query.isFeatured,
      hasDiscount: query.hasDiscount,
      sortBy: query.sortBy,
      page: query.page,
      limit: query.limit,
    });
  }

  // IMPORTANTE: este método debe estar ANTES de /:id para que NestJS lo resuelva primero
  @Get('slug/:slug')
  @ApiOperation({ summary: 'Obtener producto por slug' })
  @ApiParam({ name: 'slug', description: 'Slug único del producto' })
  @ApiResponse({ status: 200, description: 'Producto completo con todas sus relaciones' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  async findBySlug(@Param('slug') slug: string) {
    return this.productsService.findBySlug(slug);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener producto por ID' })
  @ApiParam({ name: 'id', description: 'UUID del producto' })
  @ApiResponse({ status: 200, description: 'Producto completo con todas sus relaciones' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.findById(id);
  }
}
