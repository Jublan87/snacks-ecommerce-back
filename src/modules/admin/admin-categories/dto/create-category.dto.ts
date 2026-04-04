import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  IsUrl,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ description: 'Nombre de la categoría', maxLength: 100 })
  @IsString({ message: 'El nombre debe ser un texto' })
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @MaxLength(100, { message: 'El nombre no puede exceder los 100 caracteres' })
  name!: string;

  @ApiProperty({
    required: false,
    description: 'Slug personalizado (se genera automáticamente si no se provee)',
  })
  @IsOptional()
  @IsString({ message: 'El slug debe ser un texto' })
  @MaxLength(120, { message: 'El slug no puede exceder los 120 caracteres' })
  slug?: string;

  @ApiProperty({ required: false, nullable: true, description: 'Descripción de la categoría' })
  @IsOptional()
  @IsString({ message: 'La descripción debe ser un texto' })
  @MaxLength(500, { message: 'La descripción no puede exceder los 500 caracteres' })
  description?: string | null;

  @ApiProperty({ required: false, nullable: true, description: 'UUID de la categoría padre' })
  @IsOptional()
  @IsUUID('4', { message: 'El ID de categoría padre debe ser un UUID válido' })
  parentId?: string | null;

  @ApiProperty({ required: false, nullable: true, description: 'URL de la imagen de la categoría' })
  @IsOptional()
  @IsUrl({}, { message: 'La imagen debe ser una URL válida' })
  image?: string | null;

  @ApiProperty({ required: false, default: 0, minimum: 0, description: 'Orden de visualización' })
  @IsOptional()
  @IsInt({ message: 'El orden debe ser un número entero' })
  @Min(0, { message: 'El orden no puede ser negativo' })
  @Type(() => Number)
  order?: number = 0;

  @ApiProperty({ required: false, default: true, description: 'Si la categoría está activa' })
  @IsOptional()
  @IsBoolean({ message: 'El campo isActive debe ser un valor booleano' })
  @Transform(({ obj, key }) => {
    const raw = obj[key];
    if (raw === undefined || raw === null) return true;
    return raw === 'true' || raw === true;
  })
  isActive?: boolean = true;
}
