import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JWT_COOKIE_NAME } from '../utils/jwt.util';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { ERROR_CODES } from '../../../common/constants/error-codes';
import { UsersService } from '../../users/users.service';
import { UserWithoutPassword } from '../../users/interfaces/user-without-password.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly usersService: UsersService,
    configService: ConfigService,
  ) {
    const fromCookie = (req: { cookies?: Record<string, string> }) =>
      req?.cookies?.[JWT_COOKIE_NAME] ?? null;
    const fromHeader = ExtractJwt.fromAuthHeaderAsBearerToken();

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([fromCookie, fromHeader]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret') as string,
    });
  }

  async validate(payload: JwtPayload): Promise<UserWithoutPassword> {
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException({
        code: ERROR_CODES.INVALID_TOKEN,
        message: 'Usuario no encontrado',
      });
    }
    return user;
  }
}
