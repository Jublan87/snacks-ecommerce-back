/**
 * Límites de rate limiting leídos desde variables de entorno.
 * Los defaults aquí son valores de DESARROLLO (permisivos).
 * Para producción, configurar las env vars con valores más estrictos.
 * Ver .env.example para referencia de valores de producción.
 */

function env(key: string, fallback: number): number {
  const val = process.env[key];
  const parsed = val !== undefined ? parseInt(val, 10) : NaN;
  return isNaN(parsed) ? fallback : parsed;
}

// Segundos de TTL por contexto
const DEFAULT_TTL = env('THROTTLE_DEFAULT_TTL', 60) * 1000;
const LOGIN_TTL = env('THROTTLE_LOGIN_TTL', 60) * 1000;
const REGISTER_TTL = env('THROTTLE_REGISTER_TTL', 60) * 1000;
const ADMIN_TTL = env('THROTTLE_ADMIN_TTL', 60) * 1000;

// Cantidad máxima de requests por TTL
const DEFAULT_LIMIT = env('THROTTLE_DEFAULT_LIMIT', 1000);
const LOGIN_LIMIT = env('THROTTLE_LOGIN_LIMIT', 50);
const REGISTER_LIMIT = env('THROTTLE_REGISTER_LIMIT', 30);
const ADMIN_LIMIT = env('THROTTLE_ADMIN_LIMIT', 500);

/**
 * Límites de rate limiting por contexto.
 * Usar con @Throttle({ login: THROTTLE_OPTIONS.login }) en controladores.
 */
export const THROTTLE_OPTIONS = {
  /** Login: configurable vía THROTTLE_LOGIN_LIMIT / THROTTLE_LOGIN_TTL */
  login: { limit: LOGIN_LIMIT, ttl: LOGIN_TTL },

  /** Registro: configurable vía THROTTLE_REGISTER_LIMIT / THROTTLE_REGISTER_TTL */
  register: { limit: REGISTER_LIMIT, ttl: REGISTER_TTL },

  /** Admin: configurable vía THROTTLE_ADMIN_LIMIT / THROTTLE_ADMIN_TTL */
  admin: { limit: ADMIN_LIMIT, ttl: ADMIN_TTL },
};

/**
 * Configuración para ThrottlerModule.forRoot().
 * - default: aplica al resto de la API
 * - login, register, admin: límites específicos para endpoints sensibles
 */
export const THROTTLE_MODULE_LIMITS = [
  { name: 'default', ttl: DEFAULT_TTL, limit: DEFAULT_LIMIT },
  { name: 'login', ...THROTTLE_OPTIONS.login },
  { name: 'register', ...THROTTLE_OPTIONS.register },
  { name: 'admin', ...THROTTLE_OPTIONS.admin },
];
