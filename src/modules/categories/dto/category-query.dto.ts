import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

export class CategoryQueryDto {
  @ApiProperty({
    required: false,
    description: 'Si true, retorna lista plana en lugar de estructura jerárquica',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ obj, key }) => {
    const raw = obj[key];
    return raw === 'true' || raw === true;
  })
  flat?: boolean;

  @ApiProperty({
    required: false,
    description: 'Si true, incluye categorías inactivas en el resultado',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ obj, key }) => {
    const raw = obj[key];
    return raw === 'true' || raw === true;
  })
  includeInactive?: boolean;
}
