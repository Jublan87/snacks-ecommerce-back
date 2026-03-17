import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class UpdateStockDto {
  @ApiProperty({ minimum: 0, description: 'Nuevo valor de stock' })
  @IsInt()
  @Min(0)
  @Type(() => Number)
  newStock: number;

  @ApiProperty({ required: false, maxLength: 500, description: 'Razón del cambio de stock' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
