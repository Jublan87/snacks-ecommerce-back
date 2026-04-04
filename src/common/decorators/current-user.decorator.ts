import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserWithoutPassword } from '../../modules/users/interfaces/user-without-password.interface';

/**
 * Extrae el usuario autenticado del request (inyectado por JwtStrategy).
 * Usar en rutas protegidas con JwtAuthGuard.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UserWithoutPassword => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
