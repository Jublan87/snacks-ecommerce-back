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
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({
    required: false,
    description: 'Slug personalizado (se genera automáticamente si no se provee)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  slug?: string;

  @ApiProperty({ required: false, nullable: true, description: 'Descripción de la categoría' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string | null;

  @ApiProperty({ required: false, nullable: true, description: 'UUID de la categoría padre' })
  @IsOptional()
  @IsUUID()
  parentId?: string | null;

  @ApiProperty({ required: false, nullable: true, description: 'URL de la imagen de la categoría' })
  @IsOptional()
  @IsUrl()
  image?: string | null;

  @ApiProperty({ required: false, default: 0, minimum: 0, description: 'Orden de visualización' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  order?: number = 0;

  @ApiProperty({ required: false, default: true, description: 'Si la categoría está activa' })
  @IsOptional()
  @IsBoolean()
  @Transform(({ obj, key }) => {
    const raw = obj[key];
    if (raw === undefined || raw === null) return true;
    return raw === 'true' || raw === true;
  })
  isActive?: boolean = true;
}
