import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class StockHistoryQueryDto {
  @ApiProperty({ required: false, description: 'ID del producto para filtrar', format: 'uuid' })
  @IsOptional()
  @IsString({ message: 'El ID del producto debe ser un texto' })
  productId?: string;

  @ApiProperty({
    required: false,
    description: 'Fecha desde (ISO 8601)',
    example: '2025-01-01',
  })
  @IsOptional()
  @IsDateString({}, { message: 'La fecha desde debe ser una fecha válida en formato ISO 8601' })
  dateFrom?: string;

  @ApiProperty({
    required: false,
    description: 'Fecha hasta (ISO 8601)',
    example: '2025-12-31',
  })
  @IsOptional()
  @IsDateString({}, { message: 'La fecha hasta debe ser una fecha válida en formato ISO 8601' })
  dateTo?: string;

  @ApiProperty({
    required: false,
    default: 'newest',
    enum: ['newest', 'oldest'],
    description: 'Criterio de ordenamiento por fecha',
  })
  @IsOptional()
  @IsIn(['newest', 'oldest'], { message: 'El criterio de ordenamiento debe ser: newest u oldest' })
  sort?: 'newest' | 'oldest' = 'newest';

  @ApiProperty({ required: false, default: 1, minimum: 1, description: 'Página actual' })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La página debe ser un número entero' })
  @Min(1, { message: 'La página debe ser al menos 1' })
  page?: number = 1;

  @ApiProperty({
    required: false,
    default: 10,
    minimum: 1,
    maximum: 50,
    description: 'Resultados por página',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El límite debe ser un número entero' })
  @Min(1, { message: 'El límite debe ser al menos 1' })
  @Max(50, { message: 'El límite no puede ser mayor a 50' })
  limit?: number = 10;
}
