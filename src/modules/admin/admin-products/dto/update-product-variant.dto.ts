import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { UpdateVariantOptionDto } from './update-variant-option.dto';

export class UpdateProductVariantDto {
  @ApiProperty({ required: false, description: 'ID de la variante existente a actualizar' })
  @IsOptional()
  @IsUUID('all', { message: 'El ID de la variante debe ser un UUID válido' })
  id?: string;

  @ApiProperty({ description: 'Nombre de la variante' })
  @IsString({ message: 'El nombre de la variante debe ser un texto' })
  name: string;

  @ApiProperty({ type: [UpdateVariantOptionDto], description: 'Opciones de la variante' })
  @IsArray({ message: 'Las opciones deben ser un arreglo' })
  @ArrayMinSize(1, { message: 'Debe incluir al menos una opción de variante' })
  @ValidateNested({ each: true })
  @Type(() => UpdateVariantOptionDto)
  options: UpdateVariantOptionDto[];
}
