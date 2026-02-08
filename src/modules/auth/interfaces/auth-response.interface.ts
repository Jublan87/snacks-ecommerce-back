import { SessionUser } from './session-user.interface';

/**
 * Respuesta de login y register en el body de la API.
 * Solo expone SessionUser (id, email, firstName, role). El token va en cookie HttpOnly.
 */
export interface AuthResponse {
  user: SessionUser;
}

/**
 * Resultado interno de login/register (servicio).
 * Incluye accessToken para que el controller lo ponga en la cookie; no se expone en el body.
 */
export interface AuthResult {
  user: SessionUser;
  accessToken: string;
}
