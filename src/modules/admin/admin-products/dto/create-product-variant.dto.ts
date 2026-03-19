import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsString, ValidateNested } from 'class-validator';
import { CreateVariantOptionDto } from './create-variant-option.dto';

export class CreateProductVariantDto {
  @ApiProperty({ description: 'Nombre de la variante (ej: "Tamaño", "Color")' })
  @IsString({ message: 'El nombre de la variante debe ser un texto' })
  name: string;

  @ApiProperty({ type: [CreateVariantOptionDto], description: 'Opciones de la variante' })
  @IsArray({ message: 'Las opciones deben ser un arreglo' })
  @ArrayMinSize(1, { message: 'Debe incluir al menos una opción de variante' })
  @ValidateNested({ each: true })
  @Type(() => CreateVariantOptionDto)
  options: CreateVariantOptionDto[];
}
