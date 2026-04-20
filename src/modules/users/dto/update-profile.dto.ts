import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength, IsOptional } from 'class-validator';

/**
 * DTO para actualización de perfil. Las direcciones se gestionan exclusivamente
 * a través de los endpoints /addresses — este DTO no acepta shippingAddress.
 */
export class UpdateProfileDto {
  @ApiProperty({ example: 'Juan', required: false })
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'El nombre debe tener al menos 1 carácter' })
  @MaxLength(100)
  firstName?: string;

  @ApiProperty({ example: 'Pérez', required: false })
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'El apellido debe tener al menos 1 carácter' })
  @MaxLength(100)
  lastName?: string;

  @ApiProperty({ example: '+56912345678', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;
}
