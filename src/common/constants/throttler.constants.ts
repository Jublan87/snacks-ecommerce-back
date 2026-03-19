import { minutes, hours } from '@nestjs/throttler';

/**
 * Límites de rate limiting por contexto.
 * Usar con @Throttle({ login: THROTTLE_OPTIONS.login }) en controladores.
 */
export const THROTTLE_OPTIONS = {
  /** Login: 5 intentos por 15 minutos */
  login: { limit: 5, ttl: minutes(15) },

  /** Registro: 3 intentos por hora */
  register: { limit: 3, ttl: hours(1) },

  /** Admin: 200 requests por 15 minutos */
  admin: { limit: 200, ttl: minutes(15) },
} as const;

/**
 * Configuración para ThrottlerModule.forRoot().
 * - default: 100 requests por 15 minutos (resto de la API)
 * - login, register, admin: límites específicos para endpoints sensibles
 */
export const THROTTLE_MODULE_LIMITS = [
  { name: 'default', ttl: minutes(15), limit: 100 },
  { name: 'login', ...THROTTLE_OPTIONS.login },
  { name: 'register', ...THROTTLE_OPTIONS.register },
  { name: 'admin', ...THROTTLE_OPTIONS.admin },
];
