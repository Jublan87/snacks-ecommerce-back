import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsUUID, Min } from 'class-validator';

export class CreateOrderItemDto {
  @ApiProperty({ example: 'bd02f4f7-af66-4c54-aff9-d1cdd77a540e' })
  @IsNotEmpty()
  @IsUUID()
  productId: string;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  quantity: number;
}
