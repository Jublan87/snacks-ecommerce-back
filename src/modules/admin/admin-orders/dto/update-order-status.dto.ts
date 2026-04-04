import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { OrderStatus } from '@prisma/client';

export class UpdateOrderStatusDto {
  @ApiProperty({ enum: OrderStatus, description: 'Nuevo estado de la orden' })
  @IsNotEmpty({ message: 'El estado de la orden es requerido' })
  @IsEnum(OrderStatus, { message: 'El estado de la orden no es válido' })
  status!: OrderStatus;
}
