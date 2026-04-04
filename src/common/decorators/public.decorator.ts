import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marca una ruta como pública (no requiere autenticación JWT).
 * Usar en controladores o métodos que deben ser accesibles sin token.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
