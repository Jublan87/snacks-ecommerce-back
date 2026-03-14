import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CalculateShippingDto {
  @ApiProperty({ example: 5000, description: 'Subtotal del pedido' })
  @IsNumber()
  @Min(0)
  subtotal: number;

  @ApiProperty({
    example: '8320000',
    required: false,
    description: 'Código postal (para uso futuro)',
  })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiProperty({ example: 'Av. Principal 123', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ example: 'Santiago', required: false })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ example: 'Región Metropolitana', required: false })
  @IsOptional()
  @IsString()
  province?: string;
}
