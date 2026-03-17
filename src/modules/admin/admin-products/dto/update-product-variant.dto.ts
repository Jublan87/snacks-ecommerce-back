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
  @IsUUID()
  id?: string;

  @ApiProperty({ description: 'Nombre de la variante' })
  @IsString()
  name: string;

  @ApiProperty({ type: [UpdateVariantOptionDto], description: 'Opciones de la variante' })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => UpdateVariantOptionDto)
  options: UpdateVariantOptionDto[];
}
