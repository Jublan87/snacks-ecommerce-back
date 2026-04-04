import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { ShippingService } from './shipping.service';
import { CalculateShippingDto } from './dto/calculate-shipping.dto';

@ApiTags('Shipping')
@Public()
@Controller('shipping')
export class ShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  @Post('calculate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Calcular costo de envío' })
  @ApiResponse({ status: 200, description: 'Costo de envío calculado' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  calculate(@Body() dto: CalculateShippingDto) {
    return this.shippingService.calculate(dto);
  }
}
