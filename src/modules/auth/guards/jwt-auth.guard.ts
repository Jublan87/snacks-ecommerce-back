import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { Observable, lastValueFrom } from 'rxjs';
import { ERROR_CODES } from '../../../common/constants/error-codes';
import { IS_PUBLIC_KEY } from '../../../common/decorators/public.decorator';
import { LoggerService } from '../../../shared/logger/logger.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private readonly reflector: Reflector,
    private readonly logger: LoggerService,
  ) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      // En rutas públicas, intentar extraer el usuario silenciosamente.
      // Si hay token válido → request.user se pobla.
      // Si no hay token o es inválido → continuar sin error (request.user queda undefined).
      return this.activateSilently(context);
    }

    return super.canActivate(context);
  }

  private async activateSilently(context: ExecutionContext): Promise<boolean> {
    try {
      const result = super.canActivate(context);
      if (result instanceof Observable) {
        await lastValueFrom(result);
      } else {
        await result;
      }
    } catch (err) {
      this.logger.debug(
        'Token inválido en ruta pública, continuando sin autenticar',
        'JwtAuthGuard',
        {
          error: err instanceof Error ? err.message : String(err),
        },
      );
    }
    return true;
  }

  handleRequest<TUser>(
    err: Error | null,
    user: TUser | false,
    _info: unknown,
    context: ExecutionContext,
  ): TUser {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      // En rutas públicas nunca lanzar excepción: retornar usuario si válido, null si no
      if (user) return user;
      return null as unknown as TUser;
    }

    if (err || user === false) {
      throw new UnauthorizedException({
        code: ERROR_CODES.INVALID_TOKEN,
        message: 'Token inválido o expirado',
      });
    }
    return user;
  }
}
