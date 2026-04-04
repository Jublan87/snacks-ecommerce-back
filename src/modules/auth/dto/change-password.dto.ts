import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, Matches } from 'class-validator';

/**
 * Requisitos de contraseña: 8+ caracteres, al menos una mayúscula, una minúscula y un número.
 */
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export class ChangePasswordDto {
  @ApiProperty({
    example: 'MiPassword123',
    description: 'Contraseña actual del usuario',
  })
  @IsString()
  @MinLength(1, { message: 'La contraseña actual es requerida' })
  currentPassword!: string;

  @ApiProperty({
    example: 'NuevaPassword456',
    description: 'Mínimo 8 caracteres, al menos una mayúscula, una minúscula y un número',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: 'La nueva contraseña debe tener al menos 8 caracteres' })
  @Matches(PASSWORD_PATTERN, {
    message: 'La nueva contraseña debe contener al menos una mayúscula, una minúscula y un número',
  })
  newPassword!: string;
}
