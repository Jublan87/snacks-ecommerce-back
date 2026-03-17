import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsString, ValidateNested } from 'class-validator';
import { CreateVariantOptionDto } from './create-variant-option.dto';

export class CreateProductVariantDto {
  @ApiProperty({ description: 'Nombre de la variante (ej: "Tamaño", "Color")' })
  @IsString()
  name: string;

  @ApiProperty({ type: [CreateVariantOptionDto], description: 'Opciones de la variante' })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateVariantOptionDto)
  options: CreateVariantOptionDto[];
}
