import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

export const JWT_COOKIE_NAME = 'access_token';

/**
 * Genera un token JWT para el usuario.
 * El payload incluye sub (userId), email y role.
 */
export function generateToken(
  jwtService: JwtService,
  userId: string,
  email: string,
  role: string,
): string {
  return jwtService.sign({ sub: userId, email, role }, { subject: userId });
}

/**
 * Verifica y decodifica un token JWT.
 * @returns payload o null si el token es inválido
 */
export function verifyToken(jwtService: JwtService, token: string): JwtPayload | null {
  try {
    const payload = jwtService.verify<JwtPayload>(token);
    return payload;
  } catch {
    return null;
  }
}
