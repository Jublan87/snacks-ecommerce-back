import { Injectable } from '@nestjs/common';
import { ShippingCalculationService } from './services/shipping-calculation.service';
import { CalculateShippingDto } from './dto/calculate-shipping.dto';
import { ShippingResult } from './interfaces/shipping.interfaces';

@Injectable()
export class ShippingService {
  constructor(private readonly shippingCalculationService: ShippingCalculationService) {}

  calculate(dto: CalculateShippingDto): ShippingResult {
    return this.shippingCalculationService.calculateShipping(dto.subtotal);
  }
}
