import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * Restringe el acceso a la ruta por rol.
 * Solo usuarios con uno de los roles indicados pueden acceder.
 * @param roles - Roles permitidos ('admin' | 'customer' o ambos)
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
