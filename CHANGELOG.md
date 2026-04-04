# Changelog

Todos los cambios notables de este proyecto se documentan en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

---

## [0.1.0] - 2026-03-19

### Added

- Sistema de autenticación completo (JWT + cookies HttpOnly, registro, login, perfil)
- CRUD de productos con imágenes, variantes y opciones
- Sistema de categorías jerárquicas (categorías padre e hijas)
- Carrito de compras por usuario con gestión de ítems
- Sistema de pedidos con cálculo automático de totales
- Cálculo de costos de envío con umbral para envío gratuito
- Panel de administración (productos, categorías, pedidos, stock)
- Historial de movimientos de stock con trazabilidad completa
- Documentación Swagger/OpenAPI completa en `/api/swagger`
- Rate limiting diferenciado por endpoint (global, login, registro, admin)
- Manejo global de errores con filtros para excepciones Prisma y HTTP
- Mensajes de validación en español
- Health check endpoint en `/api/health`
- Seguridad: helmet, CORS configurable, compression
- Seed de datos iniciales (usuario admin, 6 categorías, 28 productos)
- Patrón Repository con `BaseRepository` genérico
- Event-driven con `EventEmitter2` (vaciado automático del carrito al crear pedido)
- Interceptors globales: logging, timeout (30s), transform response uniforme
- Decoradores personalizados: `@Public()`, `@CurrentUser()`, `@Roles()`
- Paginación reutilizable con metadatos (`calculatePaginationMeta`)
