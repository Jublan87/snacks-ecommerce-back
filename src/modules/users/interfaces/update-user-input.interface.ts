/**
 * Datos de dominio para actualizar un usuario (solo campos permitidos).
 * El servicio usa esta interfaz; el repositorio la traduce a Prisma internamente.
 */
export interface UpdateUserInput {
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  shippingAddress?: unknown;
  password?: string;
}
