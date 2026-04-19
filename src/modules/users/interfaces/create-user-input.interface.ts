/**
 * Datos de dominio para crear un usuario.
 * El servicio y la capa de aplicación usan esta interfaz;
 * el repositorio la traduce a Prisma internamente.
 * Las direcciones se crean a través de AddressesService / endpoints /addresses.
 */
export interface CreateUserInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  role?: 'customer' | 'admin';
}
