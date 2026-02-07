import { Controller, Post, Body, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { THROTTLE_OPTIONS } from '../../common/constants/throttler.constants';
import { AuthService } from './auth.service';
import { AuthResponse } from './interfaces/auth-response.interface';
import { RegisterDto } from './dto/register.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Throttle({ register: THROTTLE_OPTIONS.register })
  @ApiOperation({ summary: 'Registro de nuevo usuario' })
  @ApiResponse({ status: 201, description: 'Usuario registrado correctamente' })
  @ApiResponse({ status: 400, description: 'Datos de validación inválidos' })
  @ApiResponse({ status: 409, description: 'El email ya está registrado' })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    const result = await this.authService.register(dto);
    const { name, options } = this.authService.getCookieOptions();
    res.cookie(name, result.accessToken, options);
    return result;
  }
}
