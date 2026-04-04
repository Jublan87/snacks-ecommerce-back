# Snacks E-commerce API

![NestJS](https://img.shields.io/badge/NestJS-10.x-E0234E?style=flat-square&logo=nestjs)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-7.x-2D3748?style=flat-square&logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql)

API REST para un e-commerce de snacks. Construida con NestJS, Prisma ORM y PostgreSQL. Incluye autenticación JWT, carrito de compras, gestión de pedidos, panel de administración y documentación Swagger completa.

---

## Tabla de contenidos

1. [Tech Stack](#tech-stack)
2. [Requisitos previos](#requisitos-previos)
3. [Instalación](#instalación)
4. [Variables de entorno](#variables-de-entorno)
5. [Base de datos](#base-de-datos)
6. [Comandos de desarrollo](#comandos-de-desarrollo)
7. [Documentación API](#documentación-api-swagger)
8. [Estructura del proyecto](#estructura-del-proyecto)
9. [Arquitectura](#arquitectura)
10. [Autenticación](#autenticación)
11. [Endpoints](#endpoints)
12. [Rate Limiting](#rate-limiting)
13. [Formato de respuesta](#formato-de-respuesta)
14. [Datos de seed](#datos-de-seed)
15. [Licencia](#licencia)

---

## Tech Stack

| Tecnología | Versión |
|---|---|
| NestJS | ^10.4.16 |
| Prisma | ^7.3.0 (con `@prisma/adapter-pg`) |
| TypeScript | ^5.6.3 |
| PostgreSQL | 16 |
| Node.js | 18+ |

Otras dependencias relevantes: `helmet`, `compression`, `passport-jwt`, `class-validator`, `@nestjs/swagger`, `ThrottlerModule`, `EventEmitter2`.

---

## Requisitos previos

- **Node.js** 18 o superior
- **Docker** y **Docker Compose** (para levantar PostgreSQL en local)
- **npm** (incluido con Node.js)

---

## Instalación

```bash
git clone <url-del-repositorio>
cd snacks-ecommerce-back
npm install
```

---

## Variables de entorno

Copiá el archivo de ejemplo y completá los valores:

```bash
cp .env.example .env
```

| Variable | Default | Descripción |
|---|---|---|
| `PORT` | `4000` | Puerto en el que corre la API |
| `NODE_ENV` | — | Entorno de ejecución: `development`, `production` o `test` |
| `DATABASE_URL` | — | **Requerido.** Cadena de conexión PostgreSQL |
| `JWT_SECRET` | — | **Requerido.** Clave secreta para firmar tokens JWT (mínimo 32 caracteres) |
| `JWT_EXPIRES_IN` | `7d` | Tiempo de expiración del token JWT |
| `COOKIE_SECRET` | — | **Requerido.** Secreto para firmar cookies (mínimo 32 caracteres) |
| `FREE_SHIPPING_THRESHOLD` | `10000` | Monto mínimo para envío gratuito |
| `SHIPPING_COST` | `1500` | Costo de envío estándar |
| `CORS_ORIGIN` | `http://localhost:3000` | Origen permitido por CORS |

---

## Base de datos

### Levantar PostgreSQL con Docker

```bash
docker-compose up -d
```

Credenciales del contenedor:

| Parámetro | Valor |
|---|---|
| Usuario | `snacks_user` |
| Contraseña | `snacks_password` |
| Base de datos | `snacks_db` |
| Puerto | `5432` |

La `DATABASE_URL` del `.env.example` ya está configurada para este setup.

Para detener el contenedor: `docker-compose down`
Para borrar los datos: `docker-compose down -v`

### Migraciones y seed

```bash
npm run prisma:migrate   # Ejecutar migraciones pendientes
npm run prisma:seed      # Cargar datos iniciales
npm run prisma:studio    # Abrir UI visual de Prisma (http://localhost:5555)
```

---

## Comandos de desarrollo

| Comando | Descripción |
|---|---|
| `npm run start:dev` | Inicia el servidor en modo desarrollo con hot reload (puerto 4000) |
| `npm run build` | Compila TypeScript para producción |
| `npm run start:prod` | Ejecuta el build de producción |
| `npm run lint` | Lint del código con ESLint (auto-fix) |
| `npm run format` | Formatea el código con Prettier |
| `npm test` | Ejecuta los tests unitarios |
| `npm run test:cov` | Tests unitarios con reporte de cobertura |
| `npm run test:e2e` | Tests end-to-end |

---

## Documentación API (Swagger)

Una vez que el servidor está corriendo, la documentación interactiva está disponible en:

```
http://localhost:4000/api/swagger
```

Soporta autenticación mediante Bearer token (header `Authorization`) o cookie HttpOnly `jwt_token`.

Todos los endpoints están documentados con `@ApiOperation` y `@ApiResponse`.

---

## Estructura del proyecto

```
src/
├── main.ts                        # Bootstrap + configuración de middleware
├── app.module.ts                  # Módulo raíz
├── common/
│   ├── constants/                 # Códigos de error, configuración del throttler
│   ├── decorators/                # @Public, @CurrentUser, @Roles
│   ├── filters/                   # Filtros de excepción (Prisma + global)
│   └── interceptors/              # Logging, timeout, transform response
├── config/                        # Configuración de la app + validación Joi
├── database/                      # PrismaService + BaseRepository genérico
└── modules/
    ├── auth/                      # Autenticación (JWT + cookies)
    ├── users/                     # Gestión de usuarios
    ├── categories/                # Categorías públicas
    ├── products/                  # Productos públicos
    ├── cart/                      # Carrito de compras
    ├── orders/                    # Pedidos del cliente
    ├── shipping/                  # Cálculo de costos de envío
    └── admin/                     # Panel de administración
        ├── admin-products/
        ├── admin-categories/
        ├── admin-orders/
        └── admin-stock/
```

---

## Arquitectura

### Patrón Repository

`BaseRepository` genérico con operaciones CRUD incorporadas (`findById`, `findAll`, `findOne`, `create`, `update`, `delete`, `count`, `exists`). Cada dominio extiende esta clase base con su propio repositorio específico.

### Módulos domain-driven

Cada dominio sigue la misma estructura:

```
controller → service → repository → (Prisma)
```

Las interfaces de dominio son TypeScript puro — los tipos de Prisma no se filtran fuera de los repositorios.

### Event-driven

`EventEmitter2` para comunicación entre módulos desacoplados. Ejemplo: cuando se crea un pedido (`order.created`), el carrito del usuario se vacía automáticamente.

### Middleware global

```
helmet → compression → cookieParser
```

### Cadena de interceptors

```
LoggingInterceptor → TimeoutInterceptor (30s) → TransformInterceptor
```

### Filtros de excepción

```
PrismaExceptionFilter → AllExceptionsFilter
```

---

## Autenticación

- El token JWT se almacena en una cookie HttpOnly (`jwt_token`) y también se acepta mediante el header `Authorization: Bearer <token>`.
- **JwtAuthGuard** aplicado globalmente — todas las rutas requieren autenticación por defecto.
- **@Public()**: marca una ruta como pública (sin autenticación).
- **@Roles('admin')** + **RolesGuard**: restringe el acceso a usuarios con rol administrador.
- **@CurrentUser()**: inyecta el objeto `SessionUser` del usuario autenticado.
- Roles disponibles: `customer`, `admin`.

---

## Endpoints

### Públicos (sin autenticación)

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/auth/register` | Registro de usuario |
| `POST` | `/api/auth/login` | Login |
| `GET` | `/api/categories` | Listar categorías activas |
| `GET` | `/api/categories/:id` | Detalle de categoría |
| `GET` | `/api/products` | Listar productos activos |
| `GET` | `/api/products/:id` | Detalle de producto por ID |
| `GET` | `/api/products/slug/:slug` | Detalle de producto por slug |
| `GET` | `/api/shipping/calculate` | Calcular costo de envío |

### Autenticados (requieren JWT)

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/api/auth/logout` | Logout (limpia la cookie) |
| `GET` | `/api/auth/me` | Perfil del usuario autenticado |
| `GET` | `/api/users/profile` | Obtener perfil |
| `PATCH` | `/api/users/profile` | Actualizar perfil |
| `PATCH` | `/api/users/change-password` | Cambiar contraseña |
| `GET` | `/api/cart` | Obtener carrito |
| `POST` | `/api/cart/items` | Agregar ítem al carrito |
| `PATCH` | `/api/cart/items/:itemId` | Actualizar cantidad de ítem |
| `DELETE` | `/api/cart/items/:itemId` | Eliminar ítem del carrito |
| `DELETE` | `/api/cart` | Vaciar carrito |
| `GET` | `/api/orders` | Listar pedidos del usuario |
| `POST` | `/api/orders` | Crear pedido |
| `GET` | `/api/orders/:id` | Detalle de pedido |
| `PATCH` | `/api/orders/:id/cancel` | Cancelar pedido |

### Admin (requieren rol `admin`)

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/admin/products` | Listar todos los productos |
| `POST` | `/api/admin/products` | Crear producto |
| `GET` | `/api/admin/products/:id` | Detalle de producto |
| `PATCH` | `/api/admin/products/:id` | Actualizar producto |
| `DELETE` | `/api/admin/products/:id` | Eliminar producto |
| `GET` | `/api/admin/categories` | Listar todas las categorías |
| `POST` | `/api/admin/categories` | Crear categoría |
| `PATCH` | `/api/admin/categories/:id` | Actualizar categoría |
| `DELETE` | `/api/admin/categories/:id` | Eliminar categoría |
| `GET` | `/api/admin/orders` | Listar todos los pedidos |
| `GET` | `/api/admin/orders/:id` | Detalle de pedido |
| `PATCH` | `/api/admin/orders/:id/status` | Actualizar estado de pedido |
| `GET` | `/api/admin/stock` | Ver historial de stock |
| `POST` | `/api/admin/stock/adjust` | Ajustar stock de producto |
| `GET` | `/api/admin/stock/:productId/history` | Historial de movimientos de un producto |

---

## Rate Limiting

| Contexto | Límite |
|---|---|
| Default (global) | 100 requests / 15 minutos |
| `POST /auth/login` | 5 intentos / 15 minutos |
| `POST /auth/register` | 3 intentos / 1 hora |
| Rutas de administración | 200 requests / 15 minutos |

---

## Formato de respuesta

Todas las respuestas siguen una estructura uniforme aplicada por `TransformInterceptor`.

**Respuesta exitosa:**

```json
{
  "success": true,
  "data": { },
  "timestamp": "2026-03-19T12:00:00.000Z"
}
```

**Respuesta de error:**

```json
{
  "success": false,
  "error": {
    "code": "PRODUCT_NOT_FOUND",
    "message": "El producto solicitado no existe",
    "statusCode": 404
  },
  "timestamp": "2026-03-19T12:00:00.000Z"
}
```

---

## Datos de seed

El comando `npm run prisma:seed` carga:

- **1 usuario admin**: `admin@snacks.com` / `Admin-123`
- **6 categorías** con jerarquía (categorías padre e hijas)
- **28 productos** con imágenes, variantes y opciones

---

## Licencia

[MIT](LICENSE)
