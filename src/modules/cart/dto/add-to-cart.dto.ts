import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsUUID, Min } from 'class-validator';

export class AddToCartDto {
  @ApiProperty({ description: 'ID del producto a agregar', format: 'uuid' })
  @IsNotEmpty({ message: 'El producto es requerido' })
  @IsUUID('4', { message: 'El ID del producto debe ser un UUID válido' })
  productId: string;

  @ApiPropertyOptional({ description: 'Cantidad a agregar (default: 1)', minimum: 1, default: 1 })
  @IsOptional()
  @IsInt({ message: 'La cantidad debe ser un número entero' })
  @Min(1, { message: 'La cantidad debe ser al menos 1' })
  quantity?: number;
}
