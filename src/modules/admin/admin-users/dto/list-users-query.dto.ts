import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class ListUsersQueryDto {
  @ApiProperty({ example: 1, required: false, default: 1, description: 'Número de página' })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La página debe ser un número entero' })
  @Min(1, { message: 'La página debe ser al menos 1' })
  page?: number = 1;

  @ApiProperty({ example: 10, required: false, default: 10, description: 'Registros por página' })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El límite debe ser un número entero' })
  @Min(1, { message: 'El límite debe ser al menos 1' })
  @Max(100, { message: 'El límite no puede ser mayor a 100' })
  limit?: number = 10;

  @ApiProperty({
    enum: ['customer', 'admin'],
    required: false,
    description: 'Filtrar por rol',
  })
  @IsOptional()
  @IsEnum(['customer', 'admin'], { message: 'El rol debe ser customer o admin' })
  role?: 'customer' | 'admin';

  @ApiProperty({
    required: false,
    description: 'Buscar por email, nombre o apellido',
  })
  @IsOptional()
  @IsString({ message: 'El término de búsqueda debe ser un texto' })
  search?: string;
}
