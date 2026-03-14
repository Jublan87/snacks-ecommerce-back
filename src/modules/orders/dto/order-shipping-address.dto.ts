import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class OrderShippingAddressDto {
  @ApiProperty({ example: 'Juan' })
  @IsString()
  @MinLength(1)
  firstName: string;

  @ApiProperty({ example: 'Pérez' })
  @IsString()
  @MinLength(1)
  lastName: string;

  @ApiProperty({ example: 'juan@ejemplo.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '+56912345678' })
  @IsString()
  @MinLength(1)
  phone: string;

  @ApiProperty({ example: 'Av. Principal 123' })
  @IsString()
  @MinLength(1)
  address: string;

  @ApiProperty({ example: 'Santiago' })
  @IsString()
  @MinLength(1)
  city: string;

  @ApiProperty({ example: 'Región Metropolitana' })
  @IsString()
  @MinLength(1)
  province: string;

  @ApiProperty({ example: '8320000' })
  @IsString()
  @MinLength(1)
  postalCode: string;

  @ApiProperty({ example: 'Dejar con conserje', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
