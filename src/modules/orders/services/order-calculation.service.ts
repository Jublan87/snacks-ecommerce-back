import { Injectable } from '@nestjs/common';
import { PricedItem } from '../interfaces/order.interfaces';

@Injectable()
export class OrderCalculationService {
  calculateSubtotal(items: PricedItem[]): number {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  calculateTotal(subtotal: number, shipping: number): number {
    return subtotal + shipping;
  }
}
