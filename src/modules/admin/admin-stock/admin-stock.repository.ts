import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { BaseRepository } from '../../../database/repositories/base.repository';
import { ERROR_CODES } from '../../../common/constants/error-codes';
import {
  buildPaginatedResponse,
  calculatePaginationMeta,
} from '../../../common/utils/pagination.util';
import { StockHistoryQueryDto } from './dto/stock-history-query.dto';
import { PaginatedStockHistory, StockHistoryEntry } from './interfaces/stock-history.interface';

@Injectable()
export class AdminStockRepository extends BaseRepository<
  any,
  any,
  any,
  Prisma.StockHistoryWhereInput
> {
  constructor(prisma: PrismaService) {
    super(prisma, 'stockHistory');
  }

  async findAllHistory(filters: StockHistoryQueryDto): Promise<PaginatedStockHistory> {
    const where = this.buildWhere(filters);
    return this.queryPaginated(where, filters);
  }

  async findByProductId(
    productId: string,
    filters: StockHistoryQueryDto,
  ): Promise<PaginatedStockHistory> {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });

    if (!product) {
      throw new NotFoundException({
        code: ERROR_CODES.PRODUCT_NOT_FOUND,
        message: `Producto con id ${productId} no encontrado`,
      });
    }

    const where = this.buildWhere(filters);
    where.productId = productId;

    return this.queryPaginated(where, filters);
  }

  private buildWhere(filters: StockHistoryQueryDto): Prisma.StockHistoryWhereInput {
    const { productId, dateFrom, dateTo } = filters;
    const where: Prisma.StockHistoryWhereInput = {};

    if (productId) where.productId = productId;

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) (where.createdAt as Prisma.DateTimeFilter).gte = new Date(dateFrom);
      if (dateTo) (where.createdAt as Prisma.DateTimeFilter).lte = new Date(dateTo);
    }

    return where;
  }

  private async queryPaginated(
    where: Prisma.StockHistoryWhereInput,
    filters: StockHistoryQueryDto,
  ): Promise<PaginatedStockHistory> {
    const { sort = 'newest', page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;
    const orderBy: Prisma.StockHistoryOrderByWithRelationInput =
      sort === 'oldest' ? { createdAt: 'asc' } : { createdAt: 'desc' };

    const [records, total] = await Promise.all([
      this.prisma.stockHistory.findMany({ where, orderBy, skip, take: limit }),
      this.prisma.stockHistory.count({ where }),
    ]);

    const meta = calculatePaginationMeta(total, page, limit);
    return buildPaginatedResponse(
      records.map((r) => this.mapToEntry(r)),
      meta,
    );
  }

  private mapToEntry(record: any): StockHistoryEntry {
    return {
      id: record.id,
      productId: record.productId,
      productName: record.productName,
      previousStock: record.previousStock,
      newStock: record.newStock,
      reason: record.reason ?? null,
      createdAt: record.createdAt,
    };
  }
}
