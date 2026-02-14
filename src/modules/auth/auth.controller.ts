import { Controller, Get, Post, Put, Body, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { THROTTLE_OPTIONS } from '../../common/constants/throttler.constants';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserWithoutPassword } from '../users/interfaces/user-without-password.interface';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthService } from './auth.service';
import { AuthResponse, MeResponse, VerifyResponse } from './interfaces/auth-response.interface';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
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

  @Public()
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

  @Public()
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

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Obtener perfil del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Usuario completo sin password' })
  @ApiResponse({ status: 401, description: 'Token inválido o no enviado' })
  async me(@CurrentUser() currentUser: UserWithoutPassword): Promise<MeResponse> {
    return { user: currentUser };
  }

  @Get('verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Verificar si el token JWT es válido' })
  @ApiResponse({ status: 200, description: 'Token válido' })
  @ApiResponse({ status: 401, description: 'Token inválido o no enviado' })
  async verify(@CurrentUser() currentUser: UserWithoutPassword): Promise<VerifyResponse> {
    return {
      valid: true,
      user: {
        id: currentUser.id,
        email: currentUser.email,
        role: currentUser.role,
      },
    };
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Actualizar perfil del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Perfil actualizado correctamente' })
  @ApiResponse({ status: 400, description: 'Datos de validación inválidos' })
  @ApiResponse({ status: 401, description: 'Token inválido o no enviado' })
  async updateProfile(
    @CurrentUser() currentUser: UserWithoutPassword,
    @Body() dto: UpdateProfileDto,
  ): Promise<MeResponse> {
    const user = await this.authService.updateProfile(currentUser.id, dto);
    return { user };
  }

  @Put('password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Cambiar contraseña del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Contraseña actualizada correctamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos o contraseña actual incorrecta' })
  @ApiResponse({ status: 401, description: 'Token inválido o no enviado' })
  async changePassword(
    @CurrentUser() currentUser: UserWithoutPassword,
    @Body() dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    return this.authService.changePassword(currentUser.id, dto);
  }
}
