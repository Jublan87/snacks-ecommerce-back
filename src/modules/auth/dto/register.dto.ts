import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, Matches, MaxLength, IsOptional } from 'class-validator';

/**
 * Requisitos de contraseña: 8+ caracteres, al menos una mayúscula, una minúscula y un número.
 */
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export class RegisterDto {
  @ApiProperty({ example: 'usuario@ejemplo.com' })
  @IsEmail({}, { message: 'El email no es válido' })
  email!: string;

  @ApiProperty({
    example: 'MiPassword123',
    description: 'Mínimo 8 caracteres, al menos una mayúscula, una minúscula y un número',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @Matches(PASSWORD_PATTERN, {
    message: 'La contraseña debe contener al menos una mayúscula, una minúscula y un número',
  })
  password!: string;

  @ApiProperty({ example: 'Juan' })
  @IsString()
  @MinLength(1, { message: 'El nombre es requerido' })
  @MaxLength(100)
  firstName!: string;

  @ApiProperty({ example: 'Pérez' })
  @IsString()
  @MinLength(1, { message: 'El apellido es requerido' })
  @MaxLength(100)
  lastName!: string;

  @ApiProperty({ example: '+56912345678', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;
}
