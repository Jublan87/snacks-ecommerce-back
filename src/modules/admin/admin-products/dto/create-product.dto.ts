import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { CreateProductImageDto } from './create-product-image.dto';
import { CreateProductVariantDto } from './create-product-variant.dto';

export class CreateProductDto {
  @ApiProperty({ description: 'Nombre del producto', maxLength: 200 })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name: string;

  @ApiProperty({ description: 'Descripción completa del producto' })
  @IsString()
  @MinLength(10)
  description: string;

  @ApiProperty({ required: false, nullable: true, description: 'Descripción corta' })
  @IsOptional()
  @IsString()
  shortDescription?: string | null;

  @ApiProperty({ description: 'SKU único del producto', maxLength: 100 })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  sku: string;

  @ApiProperty({ minimum: 0, description: 'Precio regular del producto' })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price: number;

  @ApiProperty({
    required: false,
    nullable: true,
    minimum: 0,
    maximum: 100,
    description: 'Porcentaje de descuento (0-100). Se calcula discountPrice automáticamente.',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  discountPercentage?: number | null;

  @ApiProperty({ default: 0, minimum: 0, description: 'Stock disponible' })
  @IsInt()
  @Min(0)
  @Type(() => Number)
  stock: number = 0;

  @ApiProperty({ description: 'UUID de la categoría' })
  @IsUUID()
  categoryId: string;

  @ApiProperty({ required: false, description: 'Especificaciones técnicas (clave: valor)' })
  @IsOptional()
  specifications?: unknown;

  @ApiProperty({ required: false, default: true, description: 'Si el producto está activo' })
  @IsOptional()
  @IsBoolean()
  @Transform(({ obj, key }) => {
    const raw = obj[key];
    if (raw === undefined || raw === null) return true;
    return raw === 'true' || raw === true;
  })
  isActive?: boolean = true;

  @ApiProperty({ required: false, default: false, description: 'Si el producto es destacado' })
  @IsOptional()
  @IsBoolean()
  @Transform(({ obj, key }) => {
    const raw = obj[key];
    return raw === 'true' || raw === true;
  })
  isFeatured?: boolean = false;

  @ApiProperty({ required: false, type: [String], description: 'Etiquetas del producto' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[] = [];

  @ApiProperty({ required: false, nullable: true, minimum: 0, description: 'Peso en gramos' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  weight?: number | null;

  @ApiProperty({ required: false, description: 'Dimensiones {width, height, depth} en cm' })
  @IsOptional()
  dimensions?: unknown;

  @ApiProperty({ type: [CreateProductImageDto], description: 'Imágenes del producto (mín. 1)' })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateProductImageDto)
  images: CreateProductImageDto[];

  @ApiProperty({
    required: false,
    type: [CreateProductVariantDto],
    description: 'Variantes del producto',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductVariantDto)
  variants?: CreateProductVariantDto[];
}
