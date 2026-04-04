import { Injectable } from '@nestjs/common';
import { AdminStockRepository } from './admin-stock.repository';
import { StockHistoryQueryDto } from './dto/stock-history-query.dto';
import { PaginatedStockHistory } from './interfaces/stock-history.interface';

@Injectable()
export class AdminStockService {
  constructor(private readonly adminStockRepository: AdminStockRepository) {}

  findAll(filters: StockHistoryQueryDto): Promise<PaginatedStockHistory> {
    return this.adminStockRepository.findAllHistory(filters);
  }

  findByProductId(
    productId: string,
    filters: StockHistoryQueryDto,
  ): Promise<PaginatedStockHistory> {
    return this.adminStockRepository.findByProductId(productId, filters);
  }
}
