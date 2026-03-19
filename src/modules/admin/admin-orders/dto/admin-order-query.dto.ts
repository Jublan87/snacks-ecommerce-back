import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OrderStatus, PaymentMethod } from '@prisma/client';

export class AdminOrderQueryDto {
  @ApiProperty({ enum: OrderStatus, required: false })
  @IsOptional()
  @IsEnum(OrderStatus, { message: 'El estado de la orden no es válido' })
  status?: OrderStatus;

  @ApiProperty({ required: false, description: 'Filtrar por ID de usuario' })
  @IsOptional()
  @IsString({ message: 'El ID de usuario debe ser un texto' })
  userId?: string;

  @ApiProperty({ required: false, description: 'Buscar por número de orden o email' })
  @IsOptional()
  @IsString({ message: 'El término de búsqueda debe ser un texto' })
  search?: string;

  @ApiProperty({ required: false, example: '2025-01-01', description: 'Fecha desde (ISO 8601)' })
  @IsOptional()
  @IsDateString({}, { message: 'La fecha desde debe ser una fecha válida en formato ISO 8601' })
  dateFrom?: string;

  @ApiProperty({ required: false, example: '2025-12-31', description: 'Fecha hasta (ISO 8601)' })
  @IsOptional()
  @IsDateString({}, { message: 'La fecha hasta debe ser una fecha válida en formato ISO 8601' })
  dateTo?: string;

  @ApiProperty({ required: false, minimum: 0, description: 'Total mínimo' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'El total mínimo debe ser un número' })
  @Min(0, { message: 'El total mínimo no puede ser negativo' })
  minTotal?: number;

  @ApiProperty({ required: false, minimum: 0, description: 'Total máximo' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'El total máximo debe ser un número' })
  @Min(0, { message: 'El total máximo no puede ser negativo' })
  maxTotal?: number;

  @ApiProperty({ enum: PaymentMethod, required: false })
  @IsOptional()
  @IsEnum(PaymentMethod, { message: 'El método de pago no es válido' })
  paymentMethod?: PaymentMethod;

  @ApiProperty({ enum: ['newest', 'oldest', 'total-asc', 'total-desc'], required: false, default: 'newest' })
  @IsOptional()
  @IsIn(['newest', 'oldest', 'total-asc', 'total-desc'], { message: 'El criterio de ordenamiento debe ser: newest, oldest, total-asc o total-desc' })
  sort?: 'newest' | 'oldest' | 'total-asc' | 'total-desc' = 'newest';

  @ApiProperty({ example: 1, required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La página debe ser un número entero' })
  @Min(1, { message: 'La página debe ser al menos 1' })
  page?: number = 1;

  @ApiProperty({ example: 10, required: false, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El límite debe ser un número entero' })
  @Min(1, { message: 'El límite debe ser al menos 1' })
  @Max(50, { message: 'El límite no puede ser mayor a 50' })
  limit?: number = 10;
}
