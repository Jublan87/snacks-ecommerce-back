import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { OrderStatus } from '@prisma/client';

export class OrderQueryDto {
  @ApiProperty({ enum: OrderStatus, required: false })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ example: 1, required: false, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => (value ? Number.parseInt(value, 10) : 1))
  page?: number = 1;

  @ApiProperty({ example: 10, required: false, default: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  @Transform(({ value }) => (value ? Number.parseInt(value, 10) : 10))
  limit?: number = 10;

  @ApiProperty({ enum: ['newest', 'oldest'], required: false, default: 'newest' })
  @IsOptional()
  @IsIn(['newest', 'oldest'])
  sort?: 'newest' | 'oldest' = 'newest';
}
