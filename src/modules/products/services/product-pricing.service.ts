import { Injectable } from '@nestjs/common';

type DecimalLike = { toNumber(): number };

@Injectable()
export class ProductPricingService {
  /**
   * Retorna el precio efectivo del producto:
   * si tiene descuento activo, retorna discountPrice; si no, retorna price.
   */
  getEffectivePrice(price: DecimalLike, discountPrice: DecimalLike | null): number {
    if (discountPrice !== null) {
      return discountPrice.toNumber();
    }
    return price.toNumber();
  }

  /**
   * Indica si el producto tiene descuento activo.
   */
  hasActiveDiscount(discountPrice: DecimalLike | null): boolean {
    return discountPrice !== null;
  }
}
