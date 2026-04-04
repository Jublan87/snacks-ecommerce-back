import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class UpdateStockDto {
  @ApiProperty({ minimum: 0, description: 'Nuevo valor de stock' })
  @IsInt({ message: 'El stock debe ser un número entero' })
  @Min(0, { message: 'El stock no puede ser negativo' })
  @Type(() => Number)
  newStock!: number;

  @ApiProperty({ required: false, maxLength: 500, description: 'Razón del cambio de stock' })
  @IsOptional()
  @IsString({ message: 'La razón debe ser un texto' })
  @MaxLength(500, { message: 'La razón no debe superar los 500 caracteres' })
  reason?: string;
}
