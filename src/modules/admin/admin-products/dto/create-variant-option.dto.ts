import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateVariantOptionDto {
  @ApiProperty({ description: 'Valor de la opción (ej: "250g", "Rojo")' })
  @IsString({ message: 'El valor de la opción debe ser un texto' })
  value!: string;

  @ApiProperty({ required: false, nullable: true, description: 'Modificador de precio (+/-)' })
  @IsOptional()
  @IsNumber({}, { message: 'El modificador de precio debe ser un número' })
  @Type(() => Number)
  priceModifier?: number | null;

  @ApiProperty({ default: 0, minimum: 0, description: 'Stock de esta variante' })
  @IsInt({ message: 'El stock debe ser un número entero' })
  @Min(0, { message: 'El stock no puede ser negativo' })
  @Type(() => Number)
  stock: number = 0;

  @ApiProperty({ required: false, nullable: true, description: 'SKU específico de la variante' })
  @IsOptional()
  @IsString({ message: 'El SKU debe ser un texto' })
  sku?: string | null;
}
