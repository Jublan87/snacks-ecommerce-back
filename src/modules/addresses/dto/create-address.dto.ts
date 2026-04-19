import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateAddressDto {
  @ApiProperty({ example: 'Av. Corrientes 1234, Piso 3', maxLength: 500 })
  @IsString({ message: 'La dirección debe ser texto' })
  @MinLength(1, { message: 'La dirección es requerida' })
  @MaxLength(500, { message: 'La dirección no puede superar los 500 caracteres' })
  address!: string;

  @ApiProperty({ example: 'Buenos Aires', maxLength: 100 })
  @IsString({ message: 'La ciudad debe ser texto' })
  @MinLength(1, { message: 'La ciudad es requerida' })
  @MaxLength(100, { message: 'La ciudad no puede superar los 100 caracteres' })
  city!: string;

  @ApiProperty({ example: 'Buenos Aires', maxLength: 100 })
  @IsString({ message: 'La provincia debe ser texto' })
  @MinLength(1, { message: 'La provincia es requerida' })
  @MaxLength(100, { message: 'La provincia no puede superar los 100 caracteres' })
  province!: string;

  @ApiProperty({ example: '1043', maxLength: 20 })
  @IsString({ message: 'El código postal debe ser texto' })
  @MinLength(1, { message: 'El código postal es requerido' })
  @MaxLength(20, { message: 'El código postal no puede superar los 20 caracteres' })
  postalCode!: string;

  @ApiProperty({ example: 'Timbre 3B', maxLength: 500, required: false })
  @IsOptional()
  @IsString({ message: 'Las notas deben ser texto' })
  @MaxLength(500, { message: 'Las notas no pueden superar los 500 caracteres' })
  notes?: string;

  @ApiProperty({ example: 'Casa', maxLength: 100, required: false })
  @IsOptional()
  @IsString({ message: 'La etiqueta debe ser texto' })
  @MaxLength(100, { message: 'La etiqueta no puede superar los 100 caracteres' })
  label?: string;
}
