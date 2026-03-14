import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { PaymentMethod } from '@prisma/client';
import { OrderShippingAddressDto } from './order-shipping-address.dto';
import { CreateOrderItemDto } from './create-order-item.dto';

export class CreateOrderDto {
  @ApiProperty({ type: [CreateOrderItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];

  @ApiProperty({ type: OrderShippingAddressDto })
  @ValidateNested()
  @Type(() => OrderShippingAddressDto)
  shippingAddress: OrderShippingAddressDto;

  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.credit_card })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiProperty({ example: 'Sin gluten por favor', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
