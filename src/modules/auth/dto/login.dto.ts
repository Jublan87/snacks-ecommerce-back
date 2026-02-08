import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'usuario@ejemplo.com' })
  @IsEmail({}, { message: 'El email no es válido' })
  email: string;

  @ApiProperty({ example: 'MiPassword123', description: 'Contraseña del usuario' })
  @IsString()
  @MinLength(1, { message: 'La contraseña es requerida' })
  password: string;
}
