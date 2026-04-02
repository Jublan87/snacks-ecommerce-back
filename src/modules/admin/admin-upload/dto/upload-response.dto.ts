import { ApiProperty } from '@nestjs/swagger';

export class UploadResponseDto {
  @ApiProperty({
    description: 'URL pública de la imagen subida',
    example: 'https://placehold.co/600x600/EEE/31343C/png?text=producto',
  })
  url: string;
}
