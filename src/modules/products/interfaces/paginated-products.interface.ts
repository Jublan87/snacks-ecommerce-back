import { PaginationMeta } from '../../../common/utils/pagination.util';
import { ProductListItem } from './product-list-item.interface';

/**
 * Respuesta paginada de productos.
 */
export interface PaginatedProducts {
  items: ProductListItem[];
  meta: PaginationMeta;
}
