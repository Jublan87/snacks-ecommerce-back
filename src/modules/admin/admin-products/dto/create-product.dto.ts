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
  @IsString({ message: 'El nombre del producto debe ser un texto' })
  @MinLength(2, { message: 'El nombre del producto debe tener al menos 2 caracteres' })
  @MaxLength(200, { message: 'El nombre del producto no debe superar los 200 caracteres' })
  name: string;

  @ApiProperty({ description: 'Descripción completa del producto' })
  @IsString({ message: 'La descripción debe ser un texto' })
  @MinLength(10, { message: 'La descripción debe tener al menos 10 caracteres' })
  description: string;

  @ApiProperty({ required: false, nullable: true, description: 'Descripción corta' })
  @IsOptional()
  @IsString({ message: 'La descripción corta debe ser un texto' })
  shortDescription?: string | null;

  @ApiProperty({ description: 'SKU único del producto', maxLength: 100 })
  @IsString({ message: 'El SKU debe ser un texto' })
  @MinLength(2, { message: 'El SKU debe tener al menos 2 caracteres' })
  @MaxLength(100, { message: 'El SKU no debe superar los 100 caracteres' })
  sku: string;

  @ApiProperty({ minimum: 0, description: 'Precio regular del producto' })
  @IsNumber({}, { message: 'El precio debe ser un número' })
  @Min(0, { message: 'El precio no puede ser negativo' })
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
  @IsInt({ message: 'El porcentaje de descuento debe ser un número entero' })
  @Min(0, { message: 'El porcentaje de descuento no puede ser negativo' })
  @Max(100, { message: 'El porcentaje de descuento no puede superar 100' })
  @Type(() => Number)
  discountPercentage?: number | null;

  @ApiProperty({ default: 0, minimum: 0, description: 'Stock disponible' })
  @IsInt({ message: 'El stock debe ser un número entero' })
  @Min(0, { message: 'El stock no puede ser negativo' })
  @Type(() => Number)
  stock: number = 0;

  @ApiProperty({ description: 'UUID de la categoría' })
  @IsUUID('all', { message: 'El ID de categoría debe ser un UUID válido' })
  categoryId: string;

  @ApiProperty({ required: false, description: 'Especificaciones técnicas (clave: valor)' })
  @IsOptional()
  specifications?: unknown;

  @ApiProperty({ required: false, default: true, description: 'Si el producto está activo' })
  @IsOptional()
  @IsBoolean({ message: 'El campo isActive debe ser un valor booleano' })
  @Transform(({ obj, key }) => {
    const raw = obj[key];
    if (raw === undefined || raw === null) return true;
    return raw === 'true' || raw === true;
  })
  isActive?: boolean = true;

  @ApiProperty({ required: false, default: false, description: 'Si el producto es destacado' })
  @IsOptional()
  @IsBoolean({ message: 'El campo isFeatured debe ser un valor booleano' })
  @Transform(({ obj, key }) => {
    const raw = obj[key];
    return raw === 'true' || raw === true;
  })
  isFeatured?: boolean = false;

  @ApiProperty({ required: false, type: [String], description: 'Etiquetas del producto' })
  @IsOptional()
  @IsArray({ message: 'Las etiquetas deben ser un arreglo' })
  @IsString({ each: true, message: 'Cada etiqueta debe ser un texto' })
  tags?: string[] = [];

  @ApiProperty({ required: false, nullable: true, minimum: 0, description: 'Peso en gramos' })
  @IsOptional()
  @IsNumber({}, { message: 'El peso debe ser un número' })
  @Min(0, { message: 'El peso no puede ser negativo' })
  @Type(() => Number)
  weight?: number | null;

  @ApiProperty({ required: false, description: 'Dimensiones {width, height, depth} en cm' })
  @IsOptional()
  dimensions?: unknown;

  @ApiProperty({ type: [CreateProductImageDto], description: 'Imágenes del producto (mín. 1)' })
  @IsArray({ message: 'Las imágenes deben ser un arreglo' })
  @ArrayMinSize(1, { message: 'Debe incluir al menos una imagen' })
  @ValidateNested({ each: true })
  @Type(() => CreateProductImageDto)
  images: CreateProductImageDto[];

  @ApiProperty({
    required: false,
    type: [CreateProductVariantDto],
    description: 'Variantes del producto',
  })
  @IsOptional()
  @IsArray({ message: 'Las variantes deben ser un arreglo' })
  @ValidateNested({ each: true })
  @Type(() => CreateProductVariantDto)
  variants?: CreateProductVariantDto[];
}
