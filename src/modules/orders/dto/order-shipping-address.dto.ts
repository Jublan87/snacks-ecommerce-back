import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class OrderShippingAddressDto {
  @ApiProperty({ example: 'Juan' })
  @IsString({ message: 'El nombre debe ser texto' })
  @MinLength(1, { message: 'El nombre es requerido' })
  firstName!: string;

  @ApiProperty({ example: 'Pérez' })
  @IsString({ message: 'El apellido debe ser texto' })
  @MinLength(1, { message: 'El apellido es requerido' })
  lastName!: string;

  @ApiProperty({ example: 'juan@ejemplo.com' })
  @IsEmail({}, { message: 'El email no es válido' })
  email!: string;

  @ApiProperty({ example: '+56912345678' })
  @IsString({ message: 'El teléfono debe ser texto' })
  @MinLength(1, { message: 'El teléfono es requerido' })
  phone!: string;

  @ApiProperty({ example: 'Av. Principal 123' })
  @IsString({ message: 'La dirección debe ser texto' })
  @MinLength(1, { message: 'La dirección es requerida' })
  address!: string;

  @ApiProperty({ example: 'Santiago' })
  @IsString({ message: 'La ciudad debe ser texto' })
  @MinLength(1, { message: 'La ciudad es requerida' })
  city!: string;

  @ApiProperty({ example: 'Región Metropolitana' })
  @IsString({ message: 'La provincia debe ser texto' })
  @MinLength(1, { message: 'La provincia es requerida' })
  province!: string;

  @ApiProperty({ example: '8320000' })
  @IsString({ message: 'El código postal debe ser texto' })
  @MinLength(1, { message: 'El código postal es requerido' })
  postalCode!: string;

  @ApiProperty({ example: 'Dejar con conserje', required: false })
  @IsOptional()
  @IsString({ message: 'Las notas deben ser texto' })
  notes?: string;
}
