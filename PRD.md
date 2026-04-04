# PRD — Snacks E-commerce Backend API

**Producto**: API REST para E-commerce de Snacks
**Versión**: 1.0
**Fecha**: 2026-03-18
**Estado**: En desarrollo — Fases 0–6 completadas

---

## 1. Resumen Ejecutivo

Este documento describe los requerimientos del producto para el **backend del e-commerce de snacks**, una API REST que da soporte completo al frontend desarrollado en Next.js 15. El sistema permite a usuarios finales navegar productos, gestionar su carrito y realizar pedidos; y a administradores gestionar el catálogo, los pedidos y el stock.

### Problema que resuelve

El frontend existente carece de un backend que persista datos, maneje autenticación, procese pedidos y centralice la lógica de negocio. El carrito actualmente vive en `localStorage`, lo que impide sincronización entre dispositivos y no ofrece garantías de integridad en la compra.

### Objetivo

Proveer una API REST robusta, segura y bien documentada que habilite:

1. Autenticación de usuarios con JWT en cookies HttpOnly
2. Catálogo de productos y categorías públicamente accesible
3. Carrito de compras persistido en el backend
4. Flujo de checkout con creación de pedidos transaccional
5. Panel de administración completo (productos, categorías, pedidos, stock)

---

## 2. Usuarios y Roles

| Rol | Descripción | Acceso |
|-----|-------------|--------|
| **Público (anónimo)** | Visitante sin sesión | Catálogo de productos y categorías, cálculo de envío |
| **Customer** | Usuario registrado y autenticado | Todo lo anterior + carrito, pedidos propios, perfil |
| **Admin** | Administrador del sistema | Todo lo anterior + CRUD de productos/categorías, gestión de pedidos y stock |

---

## 3. Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Framework | NestJS (TypeScript) |
| Base de datos | PostgreSQL 14+ |
| ORM | Prisma |
| Autenticación | JWT + Passport + Cookies HttpOnly |
| Validación | class-validator + class-transformer |
| Documentación | Swagger / OpenAPI |
| Arquitectura | Repository Pattern + Domain Services + Event-Driven |
| Seguridad | Rate Limiting (ThrottlerModule), bcrypt, CORS |
| Monitoreo | @nestjs/terminus (Health Checks) |
| Comunicación interna | @nestjs/event-emitter |

---

## 4. Arquitectura del Sistema

### 4.1 Estructura de módulos

```
src/
├── modules/
│   ├── auth/          — Autenticación y perfil de usuario
│   ├── users/         — Gestión de usuarios
│   ├── products/      — Catálogo público de productos
│   ├── categories/    — Categorías públicas
│   ├── cart/          — Carrito de compras
│   ├── orders/        — Pedidos del usuario
│   ├── shipping/      — Cálculo de envío
│   └── admin/
│       ├── admin-products/    — CRUD admin de productos
│       ├── admin-categories/  — CRUD admin de categorías
│       ├── admin-orders/      — Gestión admin de pedidos
│       └── admin-stock/       — Historial de stock
├── common/            — Guards, interceptores, filtros, utils
├── config/            — Configuración centralizada
├── database/          — PrismaService + BaseRepository
└── shared/            — Logger, EventEmitter
```

### 4.2 Patrones de diseño

- **Repository Pattern**: Cada módulo tiene su propio repositorio que extiende `BaseRepository`. Los servicios nunca acceden a Prisma directamente.
- **Domain Services**: Lógica de negocio compleja separada en servicios de dominio (ej: `SlugGeneratorService`, `OrderCalculationService`).
- **Event-Driven**: Acciones no críticas post-transacción se comunican mediante eventos (ej: vaciar carrito al crear un pedido).
- **Interfaces de dominio**: Los repositorios mapean tipos de Prisma a interfaces TypeScript puras, desacoplando la capa de datos del negocio.

### 4.3 Pipeline de request

```
Request → ValidationPipe → JwtAuthGuard → RolesGuard
       → Controller → Service → Repository → Prisma
       ← TransformInterceptor ← Response
```

Interceptores globales aplicados en orden: `LoggingInterceptor` → `TimeoutInterceptor` → `TransformInterceptor`.

### 4.4 Formato de respuestas

**Éxito:**
```json
{ "success": true, "data": {}, "message": "Opcional" }
```

**Error:**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Mensaje legible",
    "details": {}
  }
}
```

---

## 5. Modelo de Datos

### Entidades principales

| Entidad | Tabla | Descripción |
|---------|-------|-------------|
| User | `users` | Usuarios (customer/admin), dirección de envío como JSONB |
| Category | `categories` | Jerarquía de categorías (self-reference via `parentId`) |
| Product | `products` | Catálogo con precio, descuento, stock, variantes |
| ProductImage | `product_images` | Imágenes de producto (1 principal por producto) |
| ProductVariant | `product_variants` | Grupos de variantes (ej: "Tamaño") |
| VariantOption | `variant_options` | Opciones de variante (ej: "250g") con `priceModifier` |
| Cart | `carts` | Carrito (1 por usuario) |
| CartItem | `cart_items` | Items del carrito (único por `cartId + productId`) |
| Order | `orders` | Pedido con estado, método de pago, dirección y totales |
| OrderItem | `order_items` | Items del pedido con precio capturado al momento de compra |
| StockHistory | `stock_history` | Auditoría de cambios de stock |

### Relaciones clave

```
User ──< Order ──< OrderItem >── Product
User ──< Cart  ──< CartItem  >── Product
Category ──< Product ──< ProductImage
Product ──< ProductVariant ──< VariantOption
Product ──< StockHistory
Category ──< Category (self-reference)
```

### Enums

```typescript
UserRole:      customer | admin
PaymentMethod: credit_card | debit_card | cash_on_delivery | bank_transfer
OrderStatus:   pending | confirmed | processing | shipped | delivered | cancelled
```

---

## 6. Especificación de Endpoints

### 6.1 Autenticación (`/api/auth`)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/api/auth/register` | Pública | Registra usuario, retorna JWT en cookie |
| POST | `/api/auth/login` | Pública | Autentica usuario, retorna JWT en cookie |
| POST | `/api/auth/logout` | Customer | Invalida cookie de sesión |
| GET | `/api/auth/me` | Customer | Retorna datos del usuario autenticado |
| GET | `/api/auth/verify` | Customer | Valida que el JWT sea vigente |
| PUT | `/api/auth/profile` | Customer | Actualiza nombre, teléfono, dirección |
| PUT | `/api/auth/password` | Customer | Cambia contraseña |

**Reglas de autenticación:**
- JWT almacenado en cookie HttpOnly `jwt_token` (también acepta `Authorization: Bearer`)
- Expiración: 7 días (configurable)
- Cookie: `HttpOnly; Secure; SameSite=Strict; MaxAge=604800`
- Password: mínimo 8 caracteres, al menos 1 mayúscula, 1 minúscula, 1 número
- Hash: bcrypt con 10 rounds

### 6.2 Productos públicos (`/api/products`)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/products` | Pública | Lista productos con filtros y paginación |
| GET | `/api/products/slug/:slug` | Pública | Obtiene producto por slug |
| GET | `/api/products/:id` | Pública | Obtiene producto por UUID |

**Filtros disponibles en `GET /api/products`:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `search` | string | Búsqueda en nombre, descripción y shortDescription (case-insensitive) |
| `category` | string | ID de categoría (múltiple separado por comas → OR) |
| `minPrice` | number | Precio mínimo |
| `maxPrice` | number | Precio máximo |
| `inStock` | boolean | Solo con stock > 0 |
| `isFeatured` | boolean | Solo productos destacados |
| `hasDiscount` | boolean | Solo con descuento activo |
| `sort` | enum | `name-asc \| name-desc \| price-asc \| price-desc \| newest \| oldest` |
| `page` | number | Página (default: 1) |
| `limit` | number | Items por página (default: 12, max: 100) |

**Respuesta paginada:**
```json
{
  "products": [...],
  "pagination": {
    "page": 1, "limit": 12, "totalItems": 100,
    "totalPages": 9, "hasNextPage": true, "hasPrevPage": false
  }
}
```

**Nota de soft auth:** Los admins autenticados pueden ver productos inactivos. Los usuarios anónimos/customers solo ven `isActive=true`.

### 6.3 Categorías (`/api/categories`)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/categories` | Pública | Lista categorías (jerarquía o plano según `flat`) |
| GET | `/api/categories/:id` | Pública | Obtiene categoría con sus hijos |

**Parámetros:**
- `flat=true`: retorna lista plana sin hijos
- `flat=false` (default): retorna estructura jerárquica con `children[]`
- Solo categorías `isActive=true` para usuarios públicos

### 6.4 Carrito (`/api/cart`)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/cart` | Customer | Obtiene el carrito del usuario (crea uno vacío si no existe) |
| POST | `/api/cart/items` | Customer | Agrega producto; si ya existe, incrementa cantidad |
| PUT | `/api/cart/items/:itemId` | Customer | Actualiza cantidad del item |
| DELETE | `/api/cart/items/:itemId` | Customer | Elimina item específico |
| DELETE | `/api/cart` | Customer | Vacía el carrito |

**Reglas:**
- Validar stock disponible antes de agregar o actualizar
- Validar que el producto esté activo
- Los items con producto inactivo o sin stock se marcan con `isAvailable: false` (no se eliminan automáticamente)
- El carrito se vacía automáticamente al crear un pedido (vía evento `order.created`)

### 6.5 Pedidos (`/api/orders`)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/api/orders` | Customer | Crea pedido desde el carrito activo |
| GET | `/api/orders` | Customer | Lista pedidos del usuario con paginación |
| GET | `/api/orders/:id` | Customer | Detalle de un pedido propio |
| GET | `/api/orders/number/:orderNumber` | Customer | Detalle por número de orden |

**Flujo de creación de pedido (transaccional):**
1. Obtener carrito del usuario (error 400 si vacío)
2. Validar stock de todos los productos del carrito
3. Calcular subtotal (usando `discountPrice` si existe, sino `price`)
4. Calcular shipping con `ShippingService`
5. Calcular total = subtotal + shipping
6. Generar `orderNumber` único (`ORD-YYYYMMDD-{nanoid(6)}`)
7. `prisma.$transaction()`:
   - Crear `Order` con estado `pending`
   - Crear `OrderItem` por cada item (capturar precio exacto)
   - Decrementar stock de cada producto
   - Registrar en `StockHistory`
8. Emitir `OrderCreatedEvent` (post-commit) → `CartListener` vacía el carrito

**Regla del precio capturado:** El `price` en `OrderItem` es el precio efectivo al momento de la compra. No cambia si el producto luego se actualiza.

### 6.6 Envío (`/api/shipping`)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/api/shipping/calculate` | Pública | Calcula el costo de envío según el subtotal |

**Lógica:**
- Si `subtotal >= FREE_SHIPPING_THRESHOLD` → `shipping = 0`
- Si no → `shipping = SHIPPING_COST`

**Respuesta:**
```json
{
  "shipping": 1500,
  "freeShippingThreshold": 10000,
  "isFreeShipping": false,
  "amountNeededForFreeShipping": 5000
}
```

### 6.7 Admin — Productos (`/api/admin/products`)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/products` | Admin (soft auth) | Usa el endpoint público con filtros extendidos |
| GET | `/api/products/:id` | Admin (soft auth) | Usa el endpoint público (ve inactivos) |
| POST | `/api/admin/products` | Admin | Crea un producto |
| PUT | `/api/admin/products/:id` | Admin | Actualiza un producto (parcial) |
| DELETE | `/api/admin/products/:id` | Admin | Soft delete (`isActive=false`) |
| PUT | `/api/admin/products/:id/stock` | Admin | Actualiza solo el stock |
| DELETE | `/api/admin/products/:id/images/:imageId` | Admin | Elimina imagen |
| DELETE | `/api/admin/products/:id/variants/:variantId` | Admin | Elimina variante |

**Reglas de negocio:**
- El `slug` se genera automáticamente desde `name` (lowercase, guiones). Si ya existe, se agrega sufijo numérico.
- Solo 1 imagen puede tener `isPrimary=true` por producto.
- Si se actualiza `discountPercentage`, recalcular `discountPrice = price * (1 - discountPercentage / 100)`.
- Si se actualiza `stock`, registrar en `StockHistory`.
- No se puede eliminar la única imagen de un producto (error 400).
- El `sku` debe ser único.
- Las imágenes son URLs (el cliente las sube a Cloudinary/S3 y envía la URL).
- No existe hard delete — el soft delete (`isActive=false`) preserva la integridad referencial con `OrderItem`.

### 6.8 Admin — Categorías (`/api/admin/categories`)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/categories` | Admin (soft auth) | Usa el endpoint público (ve inactivas) |
| POST | `/api/admin/categories` | Admin | Crea una categoría |
| PUT | `/api/admin/categories/:id` | Admin | Actualiza categoría (parcial) |
| DELETE | `/api/admin/categories/:id` | Admin | Elimina si no tiene productos ni subcategorías |

**Reglas:**
- Slug generado automáticamente desde `name`, con sufijo numérico si hay colisión.
- No se puede eliminar una categoría que tenga productos o hijos (error 409 con contadores).
- No se pueden crear ciclos en la jerarquía (una categoría no puede ser padre de sí misma, directa ni indirectamente).

### 6.9 Admin — Pedidos (`/api/admin/orders`)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/admin/orders` | Admin | Lista todos los pedidos con filtros avanzados y resumen estadístico |
| GET | `/api/admin/orders/:id` | Admin | Detalle de cualquier pedido |
| GET | `/api/admin/orders/number/:orderNumber` | Admin | Detalle por número de orden |
| PUT | `/api/admin/orders/:id/status` | Admin | Actualiza el estado del pedido |

**Filtros de listado:** `status`, `userId`, `search` (orderNumber, email, nombre), `dateFrom`, `dateTo`, `minTotal`, `maxTotal`, `paymentMethod`. Ordenamiento: `newest`, `oldest`, `total-asc`, `total-desc`.

**Resumen estadístico incluido en listado:**
```json
{
  "totalOrders": 150,
  "totalRevenue": 250000,
  "averageOrderValue": 1666,
  "ordersByStatus": { "pending": 10, "confirmed": 5, ... }
}
```

**Flujo de estados válido:**
```
pending → confirmed → processing → shipped → delivered
                                 ↗
cancelled (solo antes de shipped)
```

**Cancelación transaccional:** Si se cambia a `cancelled`, se ejecuta dentro de `$transaction`: actualizar estado + incrementar stock de cada producto + registrar en `StockHistory`.

### 6.10 Admin — Stock (`/api/admin/stock`)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/admin/stock/history` | Admin | Historial global de cambios de stock |
| GET | `/api/admin/stock/history/:productId` | Admin | Historial de stock de un producto |
| PUT | `/api/admin/stock/threshold` | Admin | Configura umbral de stock bajo |

---

## 7. Reglas de Negocio Globales

### Productos
- Stock nunca puede ser negativo.
- Solo productos con `isActive=true` son visibles al público.
- Si existe `discountPercentage`, el `discountPrice` debe calcularse y mantenerse sincronizado.

### Categorías
- No se permiten ciclos en la jerarquía.
- Eliminar requiere que no existan productos ni subcategorías asociadas.

### Carrito
- Un producto solo puede aparecer una vez por carrito (restricción unique en BD).
- Siempre se valida stock antes de agregar o actualizar.
- Los items obsoletos no se eliminan automáticamente — se informan al frontend.

### Pedidos
- El `orderNumber` es único e inmutable: `ORD-YYYYMMDD-{nanoid(6)}`.
- El precio capturado en `OrderItem` no cambia post-creación.
- Los estados siguen el flujo lineal definido; las transiciones inválidas retornan error.
- La cancelación es obligatoriamente transaccional con devolución de stock.

### Seguridad
- Passwords con bcrypt, 10 rounds mínimo.
- JWT válidos 7 días, almacenados en cookie HttpOnly.
- Rate limiting: login (5/15min), registro (3/hora), admin (200/15min).
- CORS restringido al origen del frontend.
- Inputs validados con class-validator + class-transformer (whitelist + forbidNonWhitelisted).

---

## 8. Variables de Entorno

| Variable | Requerida | Default | Descripción |
|----------|-----------|---------|-------------|
| `DATABASE_URL` | Sí | — | Connection string PostgreSQL |
| `JWT_SECRET` | Sí (min 32 chars) | — | Secreto para firma de JWT |
| `COOKIE_SECRET` | Sí (min 32 chars) | — | Secreto para cookies firmadas |
| `PORT` | No | `4000` | Puerto del servidor |
| `JWT_EXPIRES_IN` | No | `7d` | Expiración del JWT |
| `CORS_ORIGIN` | No | `http://localhost:3000` | Origen permitido por CORS |
| `FREE_SHIPPING_THRESHOLD` | No | `10000` | Monto para envío gratis |
| `SHIPPING_COST` | No | `1500` | Costo base de envío |
| `NODE_ENV` | No | `development` | Ambiente de ejecución |

---

## 9. Códigos de Error Internos

| Código | HTTP | Descripción |
|--------|------|-------------|
| `INVALID_CREDENTIALS` | 401 | Email o contraseña incorrectos |
| `EMAIL_EXISTS` | 409 | El email ya está registrado |
| `INVALID_PASSWORD` | 401 | La contraseña actual es incorrecta |
| `INVALID_TOKEN` | 401 | JWT inválido o expirado |
| `PRODUCT_NOT_FOUND` | 404 | Producto no encontrado |
| `PRODUCT_INACTIVE` | 400 | Producto desactivado |
| `INSUFFICIENT_STOCK` | 400 | Stock insuficiente (incluye disponible/requerido) |
| `CART_ITEM_NOT_FOUND` | 404 | Item no encontrado en el carrito |
| `ORDER_NOT_FOUND` | 404 | Pedido no encontrado |
| `INVALID_STATUS_TRANSITION` | 400 | Transición de estado inválida |
| `SKU_DUPLICATE` | 409 | SKU ya existe |
| `CATEGORY_NOT_FOUND` | 404 | Categoría no encontrada |
| `CATEGORY_HAS_DEPENDENCIES` | 409 | Categoría tiene productos o subcategorías |
| `INVALID_PARENT_CATEGORY` | 400 | El parentId crearía un ciclo |
| `LAST_IMAGE` | 400 | No se puede eliminar la única imagen |
| `VALIDATION_ERROR` | 400 | Error de validación de datos de entrada |

---

## 10. Datos Iniciales (Seed)

### Usuario admin por defecto
```
email:     admin@snacks.com
password:  Admin-123
role:      admin
```

### Categorías iniciales
- Snacks Salados (padre)
  - Papas Fritas (hija)
  - Nachos (hija)
- Golosinas (padre)
  - Chocolates (hija)
- Bebidas (padre)

**Estado actual del seed:** 6 categorías, 28 productos, 29 imágenes.

---

## 11. Estado de Implementación

| Fase | Descripción | Estado |
|------|-------------|--------|
| Fase 0 | Configuración inicial (NestJS, deps, interceptores, filtros, rate limiting) | ✅ Completa |
| Fase 1 | Base de datos (Prisma schema, migraciones, repositorios base, seed) | ✅ Completa |
| Fase 2 | Sistema de autenticación (register, login, logout, me, verify, profile, password) | ✅ Completa |
| Fase 3 | Módulos públicos (productos y categorías con filtros y paginación) | ✅ Completa |
| Fase 4 | Módulo de carrito | ✅ Completa |
| Fase 5 | Módulo de pedidos y envío (transacciones, event-driven, stock) | ✅ Completa |
| Fase 6 | Panel admin — productos y categorías | ✅ Completa |
| Fase 7 | Panel admin — pedidos y stock | ⏳ Pendiente |
| Fase 8 | Documentación Swagger y optimización | ⏳ Pendiente |
| Fase 9 | Despliegue a producción | ⏳ Pendiente |

### Fase 7 — Detalle de lo pendiente

**Admin Pedidos:**
- `GET /api/admin/orders` con filtros avanzados y resumen estadístico
- `GET /api/admin/orders/:id` y por número de orden
- `PUT /api/admin/orders/:id/status` con validación de transición y devolución de stock transaccional
- `AdminOrdersRepository`, `OrderStatusValidationService`, `OrderSummaryService`
- Evento `OrderStatusChangedEvent` + listener `StockReturnListener`

**Admin Stock:**
- `GET /api/admin/stock/history` (global y por producto)
- `PUT /api/admin/stock/threshold` (umbral de stock bajo)
- `StockHistoryRepository`, `AdminStockService`, `AdminStockController`

**Módulos a crear:**
- `AdminOrdersModule` → `src/modules/admin/admin-orders/`
- `AdminStockModule` → `src/modules/admin/admin-stock/`

### Fase 8 — Detalle de lo pendiente

- Decoradores Swagger en módulos 4–7 (`@ApiTags`, `@ApiOperation`, `@ApiResponse`, `@ApiProperty`, `@ApiBearerAuth`)
- Health checks con Terminus: `/health`, `/health/ready`, `/health/live`
- Endpoint `GET /api/version`
- Verificación de rate limiting, timeouts, compresión en todos los módulos
- README completo con arquitectura y comandos

### Fase 9 — Detalle de lo pendiente

- Preparación de variables de entorno de producción
- Selección de plataforma (Railway recomendado para MVP)
- Setup de PostgreSQL en producción
- Ejecución de migraciones y seed en producción
- Configuración de CORS, cookies HTTPS, logs de producción

---

## 12. Herramientas de Desarrollo

| Herramienta | URL / Comando |
|-------------|---------------|
| Servidor local | `http://localhost:4000` |
| Swagger UI | `http://localhost:4000/api/swagger` |
| Prisma Studio | `npx prisma studio` |
| Dev mode | `npm run start:dev` |
| Migraciones | `npm run prisma:migrate` |
| Seed | `npm run prisma:seed` |
| Type-check | `npx tsc --noEmit` |
| Lint | `npm run lint` |

---

## 13. Criterios de Aceptación del MVP

El backend se considera completo para MVP cuando:

- [ ] Todos los endpoints de las Fases 0–9 están implementados y funcionando
- [ ] Los flujos críticos son transaccionales (crear pedido, cancelar pedido)
- [ ] Stock nunca queda desincronizado respecto a los pedidos
- [ ] Autenticación con JWT en cookies HttpOnly funciona correctamente
- [ ] Solo admins pueden acceder a `/api/admin/*`
- [ ] Rate limiting activo en endpoints sensibles
- [ ] Swagger documenta todos los endpoints
- [ ] Health checks responden correctamente
- [ ] El backend responde correctamente a todas las llamadas del frontend Next.js 15
- [ ] El seed provee datos suficientes para demostración

---

*Documento generado a partir de `BACKEND_SPECIFICATION.md` y `PLANIFICACION_PROYECTO.md`*
*Para detalles de implementación de endpoints individuales, ver `BACKEND_SPECIFICATION.md`*
*Para detalle de tareas y hitos por fase, ver `PLANIFICACION_PROYECTO.md`*
