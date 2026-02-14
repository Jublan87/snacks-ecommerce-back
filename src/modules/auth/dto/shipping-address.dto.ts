import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength, IsOptional } from 'class-validator';

/**
 * Dirección de envío. Si se envía en el request, address, city, province y postalCode son requeridos.
 */
export class ShippingAddressDto {
  @ApiProperty({ example: 'Av. Principal 123' })
  @IsString()
  @MinLength(1, { message: 'La dirección es requerida' })
  @MaxLength(500)
  address: string;

  @ApiProperty({ example: 'Santiago' })
  @IsString()
  @MinLength(1, { message: 'La ciudad es requerida' })
  @MaxLength(100)
  city: string;

  @ApiProperty({ example: 'Región Metropolitana' })
  @IsString()
  @MinLength(1, { message: 'La provincia/región es requerida' })
  @MaxLength(100)
  province: string;

  @ApiProperty({ example: '8320000' })
  @IsString()
  @MinLength(1, { message: 'El código postal es requerido' })
  @MaxLength(20)
  postalCode: string;

  @ApiProperty({ example: 'Dejar con conserje', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
