import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';
import { ProductSortBy } from '../interfaces/product-filters.interface';

const SORT_BY_VALUES: ProductSortBy[] = [
  'name-asc',
  'name-desc',
  'price-asc',
  'price-desc',
  'newest',
  'oldest',
];

export class ProductQueryDto {
  @ApiProperty({ required: false, default: 1, minimum: 1, description: 'Página actual' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    required: false,
    default: 12,
    minimum: 1,
    maximum: 100,
    description: 'Resultados por página',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 12;

  @ApiProperty({
    required: false,
    minLength: 2,
    description: 'Texto para buscar en nombre, descripción o descripción corta',
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  search?: string;

  @ApiProperty({
    required: false,
    description: 'ID(s) de categoría, separados por coma. Ej: id1,id2',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ required: false, minimum: 0, description: 'Precio mínimo' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiProperty({ required: false, minimum: 0, description: 'Precio máximo' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @ApiProperty({ required: false, description: 'Solo productos en stock (stock > 0)' })
  @IsOptional()
  @IsBoolean()
  @Transform(({ obj, key }) => {
    const raw = obj[key];
    return raw === 'true' || raw === true;
  })
  inStock?: boolean;

  @ApiProperty({ required: false, description: 'Solo productos destacados' })
  @IsOptional()
  @IsBoolean()
  @Transform(({ obj, key }) => {
    const raw = obj[key];
    return raw === 'true' || raw === true;
  })
  isFeatured?: boolean;

  @ApiProperty({ required: false, description: 'Solo productos con descuento activo' })
  @IsOptional()
  @IsBoolean()
  @Transform(({ obj, key }) => {
    const raw = obj[key];
    return raw === 'true' || raw === true;
  })
  hasDiscount?: boolean;

  @ApiProperty({
    required: false,
    description: 'Solo admin: filtrar por estado activo (true) o inactivo (false)',
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ obj, key }) => {
    const raw = obj[key];
    if (raw === undefined || raw === null) return undefined;
    return raw === 'true' || raw === true;
  })
  isActive?: boolean;

  @ApiProperty({
    required: false,
    enum: SORT_BY_VALUES,
    description: 'Criterio de ordenamiento',
  })
  @IsOptional()
  @IsEnum(SORT_BY_VALUES, {
    message: `sortBy debe ser uno de: ${SORT_BY_VALUES.join(', ')}`,
  })
  sortBy?: ProductSortBy;
}
