/**
 * Input para cambiar el rol de un usuario (dominio — sin dependencias de Prisma).
 */
export interface UpdateUserRoleInput {
  role: 'customer' | 'admin';
}
