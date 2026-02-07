import * as bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

/** Requisitos: 8+ caracteres, al menos una mayúscula, una minúscula y un número */
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

/**
 * Hashea una contraseña en texto plano con bcrypt (10 rounds).
 */
export async function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

/**
 * Compara una contraseña en texto plano con un hash.
 * @returns true si coinciden
 */
export async function comparePassword(
  plainPassword: string,
  hashedPassword: string,
): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}

/**
 * Valida el formato de la contraseña.
 * Requisitos: mínimo 8 caracteres, al menos una mayúscula, una minúscula y un número.
 * @returns true si cumple el formato
 */
export function isValidPasswordFormat(password: string): boolean {
  return PASSWORD_REGEX.test(password);
}
