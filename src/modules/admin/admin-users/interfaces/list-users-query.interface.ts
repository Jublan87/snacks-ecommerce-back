/**
 * Parámetros de consulta para listar usuarios (dominio — sin dependencias de Prisma).
 */
export interface ListUsersQuery {
  page: number;
  limit: number;
  role?: 'customer' | 'admin';
  search?: string;
}
