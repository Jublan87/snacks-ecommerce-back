import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { OrderStatus } from '@prisma/client';

export class OrderQueryDto {
  @ApiProperty({ enum: OrderStatus, required: false })
  @IsOptional()
  @IsString({ message: 'El estado debe ser texto' })
  status?: string;

  @ApiProperty({ example: 1, required: false, default: 1 })
  @IsOptional()
  @IsInt({ message: 'La página debe ser un número entero' })
  @Min(1, { message: 'La página debe ser al menos 1' })
  @Transform(({ value }) => (value ? Number.parseInt(value, 10) : 1))
  page?: number = 1;

  @ApiProperty({ example: 10, required: false, default: 10 })
  @IsOptional()
  @IsInt({ message: 'El límite debe ser un número entero' })
  @Min(1, { message: 'El límite debe ser al menos 1' })
  @Max(50, { message: 'El límite no puede ser mayor a 50' })
  @Transform(({ value }) => (value ? Number.parseInt(value, 10) : 10))
  limit?: number = 10;

  @ApiProperty({ enum: ['newest', 'oldest'], required: false, default: 'newest' })
  @IsOptional()
  @IsIn(['newest', 'oldest'], { message: 'El orden debe ser newest u oldest' })
  sort?: 'newest' | 'oldest' = 'newest';
}
