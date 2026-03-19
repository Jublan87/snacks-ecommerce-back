import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CalculateShippingDto {
  @ApiProperty({ example: 5000, description: 'Subtotal del pedido' })
  @IsNumber({}, { message: 'El subtotal debe ser un número' })
  @Min(0, { message: 'El subtotal no puede ser negativo' })
  subtotal: number;

  @ApiProperty({
    example: '8320000',
    required: false,
    description: 'Código postal (para uso futuro)',
  })
  @IsOptional()
  @IsString({ message: 'El código postal debe ser un texto' })
  postalCode?: string;

  @ApiProperty({ example: 'Av. Principal 123', required: false })
  @IsOptional()
  @IsString({ message: 'La dirección debe ser un texto' })
  address?: string;

  @ApiProperty({ example: 'Santiago', required: false })
  @IsOptional()
  @IsString({ message: 'La ciudad debe ser un texto' })
  city?: string;

  @ApiProperty({ example: 'Región Metropolitana', required: false })
  @IsOptional()
  @IsString({ message: 'La provincia debe ser un texto' })
  province?: string;
}
