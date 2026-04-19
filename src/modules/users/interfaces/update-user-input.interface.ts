/**
 * Datos de dominio para actualizar un usuario (solo campos permitidos).
 * El servicio usa esta interfaz; el repositorio la traduce a Prisma internamente.
 * Las direcciones se gestionan exclusivamente a través de AddressesService / /addresses.
 */
export interface UpdateUserInput {
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  password?: string;
}
