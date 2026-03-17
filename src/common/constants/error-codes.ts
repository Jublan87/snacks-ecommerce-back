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

  // Autenticación
  /** Credenciales inválidas (login) */
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',

  /** El email ya está registrado */
  EMAIL_EXISTS: 'EMAIL_EXISTS',

  /** Contraseña no cumple requisitos o es incorrecta */
  INVALID_PASSWORD: 'INVALID_PASSWORD', // NOSONAR No es una contraseña real, es un código de error para el cliente

  /** Token JWT inválido o expirado */
  INVALID_TOKEN: 'INVALID_TOKEN',

  // Carrito
  /** Stock insuficiente para la cantidad solicitada */
  INSUFFICIENT_STOCK: 'INSUFFICIENT_STOCK',

  /** Producto inactivo */
  PRODUCT_INACTIVE: 'PRODUCT_INACTIVE',

  /** Item del carrito no encontrado */
  CART_ITEM_NOT_FOUND: 'CART_ITEM_NOT_FOUND',

  // Pedidos
  /** Pedido no encontrado */
  ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',

  /** El carrito está vacío */
  CART_EMPTY: 'CART_EMPTY',

  /** Transición de estado de pedido inválida */
  INVALID_STATUS_TRANSITION: 'INVALID_STATUS_TRANSITION',

  // Admin - Productos
  /** SKU duplicado al crear/actualizar producto */
  SKU_DUPLICATE: 'SKU_DUPLICATE',

  /** Intento de eliminar la única imagen de un producto */
  LAST_IMAGE: 'LAST_IMAGE',

  // Admin - Categorías
  /** Categoría no encontrada */
  CATEGORY_NOT_FOUND: 'CATEGORY_NOT_FOUND',

  /** Categoría tiene productos o subcategorías asociadas */
  CATEGORY_HAS_DEPENDENCIES: 'CATEGORY_HAS_DEPENDENCIES',

  /** El parentId generaría un ciclo en la jerarquía */
  INVALID_PARENT_CATEGORY: 'INVALID_PARENT_CATEGORY',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
