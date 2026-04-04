import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsOptional, ValidateNested } from 'class-validator';
import { CreateProductDto } from './create-product.dto';
import { UpdateProductImageDto } from './update-product-image.dto';
import { UpdateProductVariantDto } from './update-product-variant.dto';

export class UpdateProductDto extends PartialType(
  OmitType(CreateProductDto, ['images', 'variants'] as const),
) {
  @ApiProperty({
    required: false,
    type: [UpdateProductImageDto],
    description:
      'Imágenes del producto. Si se provee este array, reemplaza todas las imágenes existentes.',
  })
  @IsOptional()
  @IsArray({ message: 'Las imágenes deben ser un arreglo' })
  @ValidateNested({ each: true })
  @Type(() => UpdateProductImageDto)
  images?: UpdateProductImageDto[];

  @ApiProperty({
    required: false,
    type: [UpdateProductVariantDto],
    description:
      'Variantes del producto. Si se provee este array, reemplaza todas las variantes existentes.',
  })
  @IsOptional()
  @IsArray({ message: 'Las variantes deben ser un arreglo' })
  @ValidateNested({ each: true })
  @Type(() => UpdateProductVariantDto)
  variants?: UpdateProductVariantDto[];
}
