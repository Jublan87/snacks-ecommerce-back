import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ERROR_CODES } from '../../common/constants/error-codes';
import {
  hashPassword,
  isValidPasswordFormat,
  comparePassword,
} from '../../common/utils/password.util';
import { generateToken, JWT_COOKIE_NAME } from './utils/jwt.util';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResult } from './interfaces/auth-response.interface';
import { SessionUser } from './interfaces/session-user.interface';
import { AuthCookieOptions } from './interfaces/auth-cookie-options.interface';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Registra un nuevo usuario (role: customer).
   * Valida email no existente y formato de contraseña.
   */
  async register(dto: RegisterDto): Promise<AuthResult> {
    const emailExists = await this.usersService.existsByEmail(dto.email);
    if (emailExists) {
      throw new ConflictException({
        code: ERROR_CODES.EMAIL_EXISTS,
        message: 'Ya existe una cuenta con este email',
      });
    }

    if (!isValidPasswordFormat(dto.password)) {
      throw new ConflictException({
        code: ERROR_CODES.INVALID_PASSWORD,
        message:
          'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número',
      });
    }

    const hashedPassword = await hashPassword(dto.password);
    const user = await this.usersService.create({
      email: dto.email.toLowerCase().trim(),
      password: hashedPassword,
      firstName: dto.firstName.trim(),
      lastName: dto.lastName.trim(),
      phone: dto.phone?.trim() || null,
      role: 'customer',
    });

    const accessToken = generateToken(this.jwtService, user.id, user.email, user.role);
    return { user: this.toSessionUser(user), accessToken };
  }

  /**
   * Inicia sesión con email y contraseña.
   * Lanza UnauthorizedException si las credenciales son inválidas.
   */
  async login(dto: LoginDto): Promise<AuthResult> {
    const userWithPassword = await this.usersService.findByEmailWithPassword(
      dto.email.toLowerCase().trim(),
    );
    if (!userWithPassword) {
      throw new UnauthorizedException({
        code: ERROR_CODES.INVALID_CREDENTIALS,
        message: 'Email o contraseña incorrectos',
      });
    }

    const passwordMatch = await comparePassword(dto.password, userWithPassword.password);
    if (!passwordMatch) {
      throw new UnauthorizedException({
        code: ERROR_CODES.INVALID_CREDENTIALS,
        message: 'Email o contraseña incorrectos',
      });
    }

    const accessToken = generateToken(
      this.jwtService,
      userWithPassword.id,
      userWithPassword.email,
      userWithPassword.role,
    );

    return {
      user: this.toSessionUser(userWithPassword),
      accessToken,
    };
  }

  /**
   * Opciones para establecer la cookie HttpOnly con el JWT.
   */
  getCookieOptions(): AuthCookieOptions {
    const isProduction = this.configService.get<string>('app.nodeEnv') === 'production';
    const expiresIn = this.configService.get<string>('jwt.expiresIn') || '7d';
    const maxAge = this.parseExpiresToSeconds(expiresIn);

    return {
      name: JWT_COOKIE_NAME,
      options: {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'strict' : 'lax',
        maxAge: maxAge * 1000,
        path: '/',
      },
    };
  }

  private toSessionUser(user: {
    id: string;
    email: string;
    firstName: string;
    role: string;
  }): SessionUser {
    return { id: user.id, email: user.email, firstName: user.firstName, role: user.role };
  }

  private parseExpiresToSeconds(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) return 7 * 24 * 60 * 60;
    const value = parseInt(match[1], 10);
    const unit = match[2];
    const multipliers: Record<string, number> = {
      s: 1,
      m: 60,
      h: 60 * 60,
      d: 24 * 60 * 60,
    };
    return value * (multipliers[unit] ?? 604800);
  }
}
