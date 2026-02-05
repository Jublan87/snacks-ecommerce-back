/**
 * Códigos de error internos de la API.
 * Se usan en respuestas de error para que el cliente pueda identificar el tipo de fallo.
 */
export const ERROR_CODES = {
  /** Error genérico o no clasificado */
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  /** Validación fallida (ej: DTO, parámetros) */
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  /** Recurso no encontrado */
  NOT_FOUND: 'NOT_FOUND',
  /** Conflicto (ej: violación de unicidad) */
  CONFLICT: 'CONFLICT',
  /** No autorizado */
  UNAUTHORIZED: 'UNAUTHORIZED',
  /** Acceso prohibido */
  FORBIDDEN: 'FORBIDDEN',
  /** Solicitud incorrecta (bad request) */
  BAD_REQUEST: 'BAD_REQUEST',
  /** Violación de restricción de base de datos */
  DB_CONSTRAINT: 'DB_CONSTRAINT',
  /** Registro no encontrado en base de datos */
  RECORD_NOT_FOUND: 'RECORD_NOT_FOUND',
  /** Timeout de la solicitud */
  TIMEOUT: 'TIMEOUT',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
