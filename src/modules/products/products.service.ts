import { Injectable, NotFoundException } from '@nestjs/common';
import { ProductsRepository } from './products.repository';
import { ProductSearchService } from './services/product-search.service';
import { ProductFilters } from './interfaces/product-filters.interface';
import { ProductWithRelations } from './interfaces/product-with-relations.interface';
import { PaginatedProducts } from './interfaces/paginated-products.interface';
import {
  calculatePaginationMeta,
  buildPaginatedResponse,
} from '../../common/utils/pagination.util';
import { ERROR_CODES } from '../../common/constants/error-codes';

@Injectable()
export class ProductsService {
  constructor(
    private readonly productsRepository: ProductsRepository,
    private readonly productSearchService: ProductSearchService,
  ) {}

  /**
   * Listado paginado de productos con filtros y ordenamiento.
   */
  async findAll(filters: ProductFilters): Promise<PaginatedProducts> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 12;

    const where = this.productSearchService.buildWhereClause(filters);
    const orderBy = this.productSearchService.buildOrderBy(filters.sortBy);

    const { items, total } = await this.productsRepository.findAllWithFilters(
      where,
      orderBy,
      page,
      limit,
    );

    const meta = calculatePaginationMeta(total, page, limit);
    return buildPaginatedResponse(items, meta);
  }

  /**
   * Producto completo por ID.
   * Lanza NotFoundException si no existe o está inactivo (a menos que sea admin).
   */
  async findById(id: string, isAdmin = false): Promise<ProductWithRelations> {
    const product = await this.productsRepository.findByIdWithRelations(id);
    if (!product || (!product.isActive && !isAdmin)) {
      throw new NotFoundException({
        code: ERROR_CODES.NOT_FOUND,
        message: `Producto con id ${id} no encontrado`,
      });
    }
    return product;
  }

  /**
   * Producto completo por slug.
   * Lanza NotFoundException si no existe o está inactivo (a menos que sea admin).
   */
  async findBySlug(slug: string, isAdmin = false): Promise<ProductWithRelations> {
    const product = await this.productsRepository.findBySlug(slug);
    if (!product || (!product.isActive && !isAdmin)) {
      throw new NotFoundException({
        code: ERROR_CODES.NOT_FOUND,
        message: `Producto con slug "${slug}" no encontrado`,
      });
    }
    return product;
  }
}
