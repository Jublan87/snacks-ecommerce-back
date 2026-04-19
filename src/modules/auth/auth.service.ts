import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
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
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AuthResult } from './interfaces/auth-response.interface';
import { SessionUser } from './interfaces/session-user.interface';
import { AuthCookieOptions } from './interfaces/auth-cookie-options.interface';
import { UpdateUserInput } from '../users/interfaces/update-user-input.interface';
import { UserWithoutPassword } from '../users/interfaces/user-without-password.interface';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../../database/prisma.service';
import { USER_SELECT_NO_PASSWORD } from '../users/users.repository';
import { UserRole } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Registra un nuevo usuario (role: customer).
   * Valida email no existente y formato de contraseña.
   *
   * Transaction strategy: raw prisma.$transaction (interactive tx).
   * Rationale: AddressesService.create uses `this.prisma` internally and cannot
   * accept a tx client — calling it inside a transaction would bypass the tx.
   * Using raw tx.user.create + tx.address.create keeps the atomicity guarantee
   * (user + optional first address either both succeed or both fail).
   * UsersService.create is NOT called here to avoid creating a partial user
   * outside the transaction and then failing on the address step.
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

    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email: dto.email.toLowerCase().trim(),
          password: hashedPassword,
          firstName: dto.firstName.trim(),
          lastName: dto.lastName.trim(),
          phone: dto.phone?.trim() || null,
          role: UserRole.customer,
        },
      });

      if (dto.shippingAddress) {
        await tx.address.create({
          data: {
            userId: created.id,
            address: dto.shippingAddress.address,
            city: dto.shippingAddress.city,
            province: dto.shippingAddress.province,
            postalCode: dto.shippingAddress.postalCode,
            notes: dto.shippingAddress.notes ?? null,
            isDefault: true,
          },
        });
      }

      // Refetch with full select so response includes addresses[]
      return tx.user.findUniqueOrThrow({
        where: { id: created.id },
        select: USER_SELECT_NO_PASSWORD,
      });
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
   * Actualiza el perfil del usuario. Solo permite firstName, lastName y phone.
   * No permite cambiar email, role ni address — las direcciones se gestionan
   * exclusivamente a través de los endpoints /addresses.
   */
  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<UserWithoutPassword> {
    const data: UpdateUserInput = {};
    if (dto.firstName !== undefined) data.firstName = dto.firstName;
    if (dto.lastName !== undefined) data.lastName = dto.lastName;
    if (dto.phone !== undefined) data.phone = dto.phone;
    return this.usersService.update(userId, data);
  }

  /**
   * Cambia la contraseña del usuario. Verifica la contraseña actual antes de actualizar.
   */
  async changePassword(userId: string, dto: ChangePasswordDto): Promise<{ message: string }> {
    const userWithPassword = await this.usersService.findByIdWithPassword(userId);
    if (!userWithPassword) {
      throw new UnauthorizedException({
        code: ERROR_CODES.INVALID_TOKEN,
        message: 'Usuario no encontrado',
      });
    }

    const currentMatch = await comparePassword(dto.currentPassword, userWithPassword.password);
    if (!currentMatch) {
      throw new BadRequestException({
        code: ERROR_CODES.INVALID_PASSWORD,
        message: 'La contraseña actual es incorrecta',
      });
    }

    if (!isValidPasswordFormat(dto.newPassword)) {
      throw new BadRequestException({
        code: ERROR_CODES.INVALID_PASSWORD,
        message:
          'La nueva contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número',
      });
    }

    const hashedPassword = await hashPassword(dto.newPassword);
    await this.usersService.update(userId, { password: hashedPassword });

    return { message: 'Contraseña actualizada correctamente' };
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
    const match = /^(\d+)([smhd])$/.exec(expiresIn);
    if (!match) return 7 * 24 * 60 * 60;
    const value = Number.parseInt(match[1], 10);
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
