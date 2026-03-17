import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsString, IsUrl, Min } from 'class-validator';

export class CreateProductImageDto {
  @ApiProperty({ description: 'URL de la imagen' })
  @IsString()
  @IsUrl()
  url: string;

  @ApiProperty({ description: 'Texto alternativo de la imagen' })
  @IsString()
  alt: string;

  @ApiProperty({ default: false, description: 'Indica si es la imagen principal del producto' })
  @IsBoolean()
  @Transform(({ obj, key }) => {
    const raw = obj[key];
    return raw === 'true' || raw === true;
  })
  isPrimary: boolean = false;

  @ApiProperty({ default: 0, minimum: 0, description: 'Orden de visualización' })
  @IsInt()
  @Min(0)
  @Type(() => Number)
  order: number = 0;
}
