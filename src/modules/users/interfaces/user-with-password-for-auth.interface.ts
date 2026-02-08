import { UserWithoutPassword } from './user-without-password.interface';

/**
 * Usuario con password para uso en autenticación (login).
 * Incluye todos los campos del usuario para poder responder sin una segunda consulta.
 */
export interface UserWithPasswordForAuth extends UserWithoutPassword {
  password: string;
}
