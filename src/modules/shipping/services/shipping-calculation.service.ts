import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ShippingResult } from '../interfaces/shipping.interfaces';

@Injectable()
export class ShippingCalculationService {
  constructor(private readonly configService: ConfigService) {}

  calculateShipping(subtotal: number): ShippingResult {
    const threshold = Number(this.configService.get<number>('FREE_SHIPPING_THRESHOLD', 10000));
    const cost = Number(this.configService.get<number>('SHIPPING_COST', 1500));

    const isFreeShipping = subtotal >= threshold;
    const shipping = isFreeShipping ? 0 : cost;
    const amountNeededForFreeShipping = Math.max(0, threshold - subtotal);

    return {
      shipping,
      freeShippingThreshold: threshold,
      isFreeShipping,
      amountNeededForFreeShipping,
    };
  }
}
