import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export class UpdateUserRoleDto {
  @ApiProperty({
    enum: ['customer', 'admin'],
    description: 'Nuevo rol del usuario',
  })
  @IsEnum(['customer', 'admin'], { message: 'El rol debe ser customer o admin' })
  role!: 'customer' | 'admin';
}
