/**
 * Tipos y constantes de eventos para la arquitectura event-driven.
 *
 * CONVENCIÓN DE NOMBRES DE EVENTOS
 * ================================
 * Formato: `recurso.accion` (delimiter: '.')
 *
 * - recurso: entidad o contexto (order, stock, cart, user, product, etc.)
 * - accion: verbo en pasado que describe lo ocurrido (created, updated, deleted, etc.)
 *
 * Ejemplos:
 * - order.created   → se creó un pedido
 * - order.updated  → se actualizó un pedido (estado, etc.)
 * - stock.updated  → se actualizó stock de un producto
 * - stock.low      → stock bajo (opcional, para alertas)
 * - cart.updated   → se modificó el carrito
 * - user.registered → se registró un usuario
 *
 * Con wildcard habilitado se puede escuchar todos los eventos de un recurso:
 *   @OnEvent('order.*')  → order.created, order.updated, etc.
 */

/** Nombres de eventos usados en la aplicación */
export const EVENT_NAMES = {
  order: {
    created: 'order.created',
    updated: 'order.updated',
    cancelled: 'order.cancelled',
  },
  stock: {
    updated: 'stock.updated',
    low: 'stock.low',
  },
  cart: {
    updated: 'cart.updated',
  },
  user: {
    registered: 'user.registered',
  },
  product: {
    created: 'product.created',
    updated: 'product.updated',
    deleted: 'product.deleted',
  },
  category: {
    created: 'category.created',
    updated: 'category.updated',
    deleted: 'category.deleted',
  },
} as const;

/** Tipo con todos los nombres de eventos (para tipado al emitir/escuchar) */
type ValuesOf<T> = T[keyof T];
export type EventName = ValuesOf<ValuesOf<typeof EVENT_NAMES>>;
