import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateVariantOptionDto {
  @ApiProperty({ description: 'Valor de la opción (ej: "250g", "Rojo")' })
  @IsString()
  value: string;

  @ApiProperty({ required: false, nullable: true, description: 'Modificador de precio (+/-)' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  priceModifier?: number | null;

  @ApiProperty({ default: 0, minimum: 0, description: 'Stock de esta variante' })
  @IsInt()
  @Min(0)
  @Type(() => Number)
  stock: number = 0;

  @ApiProperty({ required: false, nullable: true, description: 'SKU específico de la variante' })
  @IsOptional()
  @IsString()
  sku?: string | null;
}
