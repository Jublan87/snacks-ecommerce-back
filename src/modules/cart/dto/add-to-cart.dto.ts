import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsUUID, Min } from 'class-validator';

export class AddToCartDto {
  @ApiProperty({ description: 'ID del producto a agregar', format: 'uuid' })
  @IsNotEmpty()
  @IsUUID()
  productId: string;

  @ApiPropertyOptional({ description: 'Cantidad a agregar (default: 1)', minimum: 1, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;
}
