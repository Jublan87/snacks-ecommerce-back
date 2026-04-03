import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, IsUrl, Min } from 'class-validator';

export class CreateProductImageDto {
  @ApiProperty({ description: 'URL de la imagen' })
  @IsString({ message: 'La URL de la imagen debe ser un texto' })
  @IsUrl({}, { message: 'La URL de la imagen no es válida' })
  url: string;

  @ApiProperty({
    required: false,
    description: 'Clave de almacenamiento del proveedor (retornada por el endpoint de upload)',
    example: 'snacks-ecommerce/products/abc123',
  })
  @IsOptional()
  @IsString({ message: 'El storageKey debe ser un texto' })
  storageKey?: string;

  @ApiProperty({ description: 'Texto alternativo de la imagen' })
  @IsString({ message: 'El texto alternativo debe ser un texto' })
  alt: string;

  @ApiProperty({ default: false, description: 'Indica si es la imagen principal del producto' })
  @IsBoolean({ message: 'El campo isPrimary debe ser un valor booleano' })
  @Transform(({ obj, key }) => {
    const raw = obj[key];
    return raw === 'true' || raw === true;
  })
  isPrimary: boolean = false;

  @ApiProperty({ default: 0, minimum: 0, description: 'Orden de visualización' })
  @IsInt({ message: 'El orden debe ser un número entero' })
  @Min(0, { message: 'El orden no puede ser negativo' })
  @Type(() => Number)
  order: number = 0;
}
