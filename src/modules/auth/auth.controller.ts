import { Controller, Post, Body, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { THROTTLE_OPTIONS } from '../../common/constants/throttler.constants';
import { AuthService } from './auth.service';
import { AuthResponse } from './interfaces/auth-response.interface';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

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
    const { user, accessToken } = await this.authService.register(dto);
    const { name, options } = this.authService.getCookieOptions();
    res.cookie(name, accessToken, options);
    return { user };
  }

  @Post('login')
  @Throttle({ login: THROTTLE_OPTIONS.login })
  @ApiOperation({ summary: 'Iniciar sesión' })
  @ApiResponse({ status: 200, description: 'Sesión iniciada correctamente' })
  @ApiResponse({ status: 400, description: 'Datos de validación inválidos' })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    const { user, accessToken } = await this.authService.login(dto);
    const { name, options } = this.authService.getCookieOptions();
    res.cookie(name, accessToken, options);
    return { user };
  }

  @Post('logout')
  @ApiOperation({ summary: 'Cerrar sesión' })
  @ApiResponse({ status: 200, description: 'Sesión cerrada correctamente' })
  async logout(@Res({ passthrough: true }) res: Response): Promise<{ message: string }> {
    const { name, options } = this.authService.getCookieOptions();
    res.clearCookie(name, {
      path: options.path,
      httpOnly: options.httpOnly,
      sameSite: options.sameSite,
      secure: options.secure,
    });
    return { message: 'Sesión cerrada' };
  }
}
