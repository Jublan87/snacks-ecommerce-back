import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { CreateProductImageDto } from './create-product-image.dto';

export class UpdateProductImageDto extends CreateProductImageDto {
  @ApiProperty({ required: false, description: 'ID de la imagen existente a actualizar' })
  @IsOptional()
  @IsUUID('all', { message: 'El ID de la imagen debe ser un UUID válido' })
  id?: string;
}
