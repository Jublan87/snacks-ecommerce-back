import { SessionUser } from './session-user.interface';
import { UserWithoutPassword } from '../../users/interfaces/user-without-password.interface';

/**
 * Respuesta de login y register en el body de la API.
 * Solo expone SessionUser (id, email, firstName, role). El token va en cookie HttpOnly.
 */
export interface AuthResponse {
  user: SessionUser;
}

/**
 * Respuesta de GET /api/auth/me.
 * Usuario completo sin password (id, email, firstName, lastName, phone, role, shippingAddress, createdAt, updatedAt).
 */
export interface MeResponse {
  user: UserWithoutPassword;
}

/**
 * Resultado interno de login/register (servicio).
 * Incluye accessToken para que el controller lo ponga en la cookie; no se expone en el body.
 */
export interface AuthResult {
  user: SessionUser;
  accessToken: string;
}
