import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { CreateVariantOptionDto } from './create-variant-option.dto';

export class UpdateVariantOptionDto extends CreateVariantOptionDto {
  @ApiProperty({ required: false, description: 'ID de la opción existente a actualizar' })
  @IsOptional()
  @IsUUID()
  id?: string;
}
