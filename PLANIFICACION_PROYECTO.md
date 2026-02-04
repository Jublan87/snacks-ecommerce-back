# 📅 Planificación del Proyecto - Snacks E-commerce Backend

> **Documento de planificación para el desarrollo del backend del e-commerce de snacks**
> 
> Este documento organiza el desarrollo en fases, con tareas específicas e hitos verificables para cada etapa del proyecto.

---

## 📊 Resumen Ejecutivo

**Objetivo**: Desarrollar la API REST completa para el e-commerce de snacks, siguiendo la especificación técnica del backend.

**Stack Tecnológico**:
- Framework: NestJS (TypeScript)
- Base de datos: PostgreSQL
- ORM: Prisma
- Autenticación: JWT + Cookies HttpOnly
- Validación: class-validator + class-transformer
- Documentación: Swagger/OpenAPI
- Arquitectura: Event-Driven + Repository Pattern + Domain Services
- Seguridad: Rate Limiting + Global Exception Filters

**Duración Estimada**: 8 Fases principales + Despliegue

**Nota**: Esta planificación NO incluye tests unitarios ni de integración según lo solicitado.

**Arquitectura Implementada**:
- ✅ Patrón Repository (Dependency Inversion Principle)
- ✅ Domain Services (Single Responsibility Principle)
- ✅ Event-Driven Architecture (Open/Closed Principle)
- ✅ Configuración Centralizada
- ✅ Interceptores y Filtros Globales
- ✅ Rate Limiting
- ✅ Health Checks

---

## 🎯 Índice de Fases

1. [Fase 0: Configuración Inicial del Proyecto](#fase-0-configuración-inicial-del-proyecto)
2. [Fase 1: Base de Datos y Modelos](#fase-1-base-de-datos-y-modelos)
3. [Fase 2: Sistema de Autenticación](#fase-2-sistema-de-autenticación)
4. [Fase 3: Módulo de Productos y Categorías (Público)](#fase-3-módulo-de-productos-y-categorías-público)
5. [Fase 4: Módulo de Carrito](#fase-4-módulo-de-carrito)
6. [Fase 5: Módulo de Pedidos y Envío](#fase-5-módulo-de-pedidos-y-envío)
7. [Fase 6: Panel Admin - Productos y Categorías](#fase-6-panel-admin---productos-y-categorías)
8. [Fase 7: Panel Admin - Pedidos y Stock](#fase-7-panel-admin---pedidos-y-stock)
9. [Fase 8: Documentación y Optimización](#fase-8-documentación-y-optimización)
10. [Fase 9: Despliegue a Producción](#fase-9-despliegue-a-producción)

---

## Fase 0: Configuración Inicial del Proyecto

**Objetivo**: Establecer la estructura base del proyecto con todas las herramientas necesarias.

### Tareas

#### 0.1 Inicialización del Proyecto
- [x] Crear proyecto NestJS con CLI
  ```bash
  npm i -g @nestjs/cli
  nest new snacks-ecommerce-back
  ```
- [x] Configurar estructura de carpetas completa (arquitectura mejorada)
  - `src/modules/` - módulos de negocio
    - `auth/` - autenticación (guards, strategies, decorators, dto)
    - `users/` - gestión de usuarios
    - `products/` - productos públicos (repository, domain services, dto, entities)
    - `categories/` - categorías
    - `cart/` - carrito
    - `orders/` - pedidos (domain services, events)
    - `shipping/` - envío
    - `admin/` - agrupación de módulos admin
      - `admin-products/`
      - `admin-categories/`
      - `admin-orders/`
      - `admin-stock/`
  - `src/common/` - código compartido entre módulos
    - `decorators/` - decorators personalizados
    - `filters/` - filtros de excepciones
    - `guards/` - guards reutilizables
    - `interceptors/` - interceptores (logging, transform)
    - `pipes/` - pipes de validación
    - `middleware/` - middleware personalizado
    - `interfaces/` - interfaces compartidas
    - `utils/` - utilidades (slug, password, etc.)
  - `src/config/` - configuración centralizada
    - `configuration.ts` - configuración modular
    - `database.config.ts`
    - `jwt.config.ts`
    - `validation.schema.ts`
  - `src/database/` - capa de base de datos
    - `prisma.module.ts`
    - `prisma.service.ts`
    - `repositories/` - repositorios base
      - `base.repository.ts`
      - `interfaces/`
  - `src/shared/` - módulos compartidos
    - `logger/` - servicio de logging
    - `events/` - configuración de eventos
  - `prisma/` - esquemas y migraciones
  - `src/health/` - health checks

#### 0.2 Instalación de Dependencias
- [x] Instalar Prisma
  ```bash
  npm install @prisma/client
  npm install -D prisma
  ```
- [x] Instalar dependencias de autenticación
  ```bash
  npm install @nestjs/jwt @nestjs/passport passport passport-jwt bcrypt
  npm install -D @types/passport-jwt @types/bcrypt
  ```
- [x] Instalar validación
  ```bash
  npm install class-validator class-transformer
  ```
- [x] Instalar Swagger
  ```bash
  npm install @nestjs/swagger
  ```
- [x] Instalar utilidades básicas
  ```bash
  npm install @nestjs/config dotenv cookie-parser
  npm install -D @types/cookie-parser
  ```
- [x] **NUEVO:** Instalar Event Emitter para arquitectura event-driven
  ```bash
  npm install @nestjs/event-emitter
  ```
- [x] **NUEVO:** Instalar Rate Limiting
  ```bash
  npm install @nestjs/throttler
  ```
- [x] **NUEVO:** Instalar Health Checks
  ```bash
  npm install @nestjs/terminus
  ```
- [x] **NUEVO:** Instalar Compression
  ```bash
  npm install compression
  npm install -D @types/compression
  ```

#### 0.3 Configuración de Variables de Entorno
- [x] Crear archivo `.env` con variables necesarias (copiar desde `.env.example`):
  ```env
  DATABASE_URL=postgresql://user:password@localhost:5432/snacks_db
  JWT_SECRET=your-secret-key-here
  JWT_EXPIRES_IN=7d
  COOKIE_SECRET=your-cookie-secret-here
  FREE_SHIPPING_THRESHOLD=10000
  SHIPPING_COST=1500
  CORS_ORIGIN=http://localhost:3000
  PORT=4000
  NODE_ENV=development
  ```
- [x] Crear `.env.example` con las mismas variables (sin valores sensibles)
- [x] Agregar `.env` al `.gitignore`

#### 0.4 Configuración Inicial de NestJS
- [x] **Configurar módulo de configuración global modular (`ConfigModule`)**
  - Crear `src/config/configuration.ts` con configuración estructurada
  - Configurar validación de variables de entorno con Joi
  - Exportar configuración tipada
- [x] **Configurar CORS en `main.ts`**
- [x] **Configurar cookie-parser en `main.ts`**
- [x] **Configurar compression en `main.ts`**
- [x] **Configurar pipes de validación global**
  - ValidationPipe con transform y whitelist
- [x] **Configurar prefijo global de rutas (`/api`)**

#### 0.5 **NUEVO:** Configuración de Interceptores Globales
- [ ] Crear `src/common/interceptors/logging.interceptor.ts`
  - Loggear método, ruta, duración, status code
  - Loggear en formato estructurado
- [ ] Crear `src/common/interceptors/transform.interceptor.ts`
  - Transformar todas las respuestas a formato estándar
  - Estructura: `{ success: true, data: any, timestamp: string }`
- [ ] Crear `src/common/interceptors/timeout.interceptor.ts`
  - Configurar timeout de 30 segundos para requests
- [ ] Registrar interceptores globales en `main.ts`

#### 0.6 **NUEVO:** Configuración de Filtros de Excepciones Globales
- [ ] Crear `src/common/filters/all-exceptions.filter.ts`
  - Capturar todas las excepciones
  - Formatear respuestas de error consistentes
  - Loggear errores 500 con stack trace
  - Sanitizar errores en producción
- [ ] Crear `src/common/filters/prisma-exception.filter.ts`
  - Mapear excepciones de Prisma a HTTP status apropiados
  - Códigos de error específicos de BD
- [ ] Crear códigos de error internos en `src/common/constants/error-codes.ts`
- [ ] Registrar filtros globales en `main.ts`

#### 0.7 **NUEVO:** Configuración de Rate Limiting
- [ ] Configurar ThrottlerModule globalmente
  - Default: 100 requests por 15 minutos
- [ ] Crear configuración específica para endpoints sensibles:
  - Login: 5 intentos por 15 minutos
  - Registro: 3 intentos por hora
  - Admin: 200 requests por 15 minutos
- [ ] Aplicar ThrottlerGuard globalmente

#### 0.8 Configuración de Base de Datos
- [x] Crear base de datos PostgreSQL local (docker-compose)
- [x] Inicializar Prisma (schema.prisma + PrismaService + PrismaModule)
- [x] Verificar conexión a la base de datos (PrismaService.$connect en onModuleInit)

#### 0.9 **NUEVO:** Configuración de Event Emitter
- [ ] Configurar EventEmitterModule globalmente
  - Configurar wildcard: true
  - Configurar delimiter: '.'
- [ ] Crear tipos de eventos en `src/common/events/event-types.ts`
- [ ] Documentar convención de nombres de eventos (ej: `order.created`, `stock.updated`)

#### 0.10 **NUEVO:** Configuración de Logger Personalizado
- [ ] Crear `src/shared/logger/logger.module.ts`
- [ ] Crear `src/shared/logger/logger.service.ts`
  - Niveles: error, warn, info, debug
  - Formato estructurado (JSON en producción)
  - Incluir contexto y timestamp
- [ ] Inyectar Logger en módulos principales

### Hitos de la Fase 0
✅ **Hito 0.1**: Proyecto NestJS creado y servidor levantado en `http://localhost:4000`  
✅ **Hito 0.2**: Todas las dependencias instaladas sin errores  
✅ **Hito 0.3**: Variables de entorno configuradas correctamente con validación  
✅ **Hito 0.4**: CORS, validación global y compression funcionando  
✅ **Hito 0.5**: Conexión a PostgreSQL establecida  
✅ **Hito 0.6**: Interceptores globales configurados (logging, transform, timeout)  
✅ **Hito 0.7**: Filtros de excepciones globales funcionando  
✅ **Hito 0.8**: Rate limiting configurado y funcionando  
✅ **Hito 0.9**: Event Emitter configurado  
✅ **Hito 0.10**: Logger personalizado funcionando

**Criterio de Finalización**: Servidor NestJS ejecutándose con arquitectura base completa: interceptores, filtros, rate limiting, eventos y configuración centralizada.

---

## Fase 1: Base de Datos y Modelos

**Objetivo**: Definir el esquema de la base de datos y generar los modelos con Prisma.

### Tareas

#### 1.1 Creación del Esquema Prisma
- [ ] Definir modelo `User` en `prisma/schema.prisma`
- [ ] Definir modelo `Category` con auto-relación (jerarquía)
- [ ] Definir modelo `Product` con todas sus propiedades
- [ ] Definir modelo `ProductImage`
- [ ] Definir modelo `ProductVariant` y `VariantOption`
- [ ] Definir modelo `Cart` y `CartItem`
- [ ] Definir modelo `Order` y `OrderItem`
- [ ] Definir modelo `StockHistory`
- [ ] Definir enums: `UserRole`, `PaymentMethod`, `OrderStatus`
- [ ] Agregar índices según especificación
- [ ] Agregar relaciones entre modelos

#### 1.2 Migraciones de Base de Datos
- [ ] Crear primera migración
  ```bash
  npx prisma migrate dev --name init
  ```
- [ ] Verificar que todas las tablas se crearon correctamente
- [ ] Generar Prisma Client
  ```bash
  npx prisma generate
  ```

#### 1.3 Configuración de Prisma Service
- [ ] Crear módulo Prisma (`src/database/prisma.module.ts`)
- [ ] Crear servicio Prisma (`src/database/prisma.service.ts`)
- [ ] Configurar `onModuleInit` y `onModuleDestroy` para conexiones
- [ ] Configurar logging de queries en desarrollo
- [ ] Exportar `PrismaService` globalmente

#### 1.4 **NUEVO:** Creación de Capa de Repositorios Base
- [ ] Crear `src/database/repositories/interfaces/base-repository.interface.ts`
  - Definir interfaz genérica con operaciones CRUD
  - Métodos: findById, findAll, create, update, delete, findOne
- [ ] Crear `src/database/repositories/base.repository.ts`
  - Implementar clase abstracta base
  - Proporcionar métodos comunes reutilizables
  - Incluir manejo de errores estándar
- [ ] Documentar patrón de uso de repositorios

#### 1.5 Seeds de Datos Iniciales
- [ ] Crear archivo `prisma/seed.ts`
- [ ] Agregar usuario admin por defecto:
  - Email: `admin@snacks.com`
  - Password: `Admin-123` (hasheado)
  - Role: `admin`
- [ ] Agregar categorías iniciales:
  - Dulces
  - Salados
  - Bebidas
  - Chocolates
- [ ] (Opcional) Agregar 3-5 productos de ejemplo con imágenes
- [ ] Configurar script de seed en `package.json`
  ```json
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  }
  ```
- [ ] Ejecutar seed
  ```bash
  npx prisma db seed
  ```

#### 1.6 Verificación de Base de Datos
- [ ] Usar Prisma Studio para verificar datos
  ```bash
  npx prisma studio
  ```
- [ ] Verificar que el usuario admin existe
- [ ] Verificar que las categorías existen
- [ ] Verificar relaciones entre tablas

### Hitos de la Fase 1
✅ **Hito 1.1**: Esquema Prisma completo con todos los modelos  
✅ **Hito 1.2**: Migración ejecutada y base de datos creada  
✅ **Hito 1.3**: PrismaService configurado y funcionando  
✅ **Hito 1.4**: Capa de repositorios base implementada  
✅ **Hito 1.5**: Seeds ejecutados con usuario admin y categorías  
✅ **Hito 1.6**: Datos visibles en Prisma Studio

**Criterio de Finalización**: Base de datos completamente poblada con datos iniciales, Prisma Client funcionando y capa de repositorios base lista para usar.

---

## Fase 2: Sistema de Autenticación

**Objetivo**: Implementar autenticación completa con JWT y gestión de usuarios.

### Tareas

#### 2.1 Configuración de Autenticación
- [ ] Crear módulo `AuthModule`
- [ ] Crear servicio `AuthService`
- [ ] Crear módulo `UsersModule`
- [ ] **NUEVO:** Crear `UsersRepository` extendiendo `BaseRepository`
  - Métodos: findByEmail, findById, create, update
  - Implementar queries específicas de usuarios
- [ ] Crear servicio `UsersService` para operaciones CRUD de usuarios
  - **Inyectar UsersRepository** (no PrismaService directamente)

#### 2.2 Utilidades de Autenticación
- [ ] Crear `src/common/utils/password.util.ts`
  - Función de hash de passwords con bcrypt (10 rounds)
  - Función de comparación de passwords
  - Función de validación de formato de password
- [ ] Crear `src/modules/auth/utils/jwt.util.ts`
  - Función de generación de JWT
  - Función de verificación de JWT

#### 2.3 Guards y Decorators
- [ ] Crear `JwtAuthGuard` (Guard de autenticación)
- [ ] Crear `RolesGuard` (Guard de roles - admin/customer)
- [ ] Crear decorator `@Public()` para rutas públicas
- [ ] Crear decorator `@Roles()` para rutas con roles específicos
- [ ] Crear decorator `@CurrentUser()` para obtener usuario actual
- [ ] Configurar `JwtStrategy` para Passport

#### 2.4 Endpoints de Autenticación
- [ ] **POST /api/auth/register**
  - Validar datos de entrada con DTOs
  - Verificar que email no exista
  - Validar formato de password (8+ caracteres, mayúscula, minúscula, número)
  - Hashear password
  - Crear usuario con role `customer`
  - Generar JWT
  - Establecer cookie HttpOnly
  - Retornar usuario y token
- [ ] **POST /api/auth/login**
  - Validar email y password
  - Buscar usuario por email
  - Comparar password
  - Generar JWT
  - Establecer cookie HttpOnly
  - Retornar usuario y token
- [ ] **POST /api/auth/logout**
  - Limpiar cookie de autenticación
  - Retornar mensaje de éxito
- [ ] **GET /api/auth/me**
  - Proteger con `JwtAuthGuard`
  - Retornar usuario autenticado
- [ ] **GET /api/auth/verify**
  - Proteger con `JwtAuthGuard`
  - Verificar validez del token
  - Retornar información básica del usuario

#### 2.5 Endpoints de Perfil de Usuario
- [ ] **PUT /api/auth/profile**
  - Proteger con `JwtAuthGuard`
  - Validar datos con DTOs
  - Actualizar firstName, lastName, phone, shippingAddress
  - No permitir cambiar email ni role
  - Retornar usuario actualizado
- [ ] **PUT /api/auth/password**
  - Proteger con `JwtAuthGuard`
  - Validar password actual
  - Validar nuevo password (requisitos)
  - Hashear nuevo password
  - Actualizar password
  - Retornar mensaje de éxito

#### 2.6 DTOs de Validación
- [ ] Crear `RegisterDto` con validaciones
- [ ] Crear `LoginDto` con validaciones
- [ ] Crear `UpdateProfileDto` con validaciones
- [ ] Crear `ChangePasswordDto` con validaciones

#### 2.7 Manejo de Errores de Autenticación
- [ ] Implementar filtros de excepciones personalizados
- [ ] Códigos de error específicos:
  - `INVALID_CREDENTIALS`
  - `EMAIL_EXISTS`
  - `INVALID_PASSWORD`
  - `INVALID_TOKEN`
  - `VALIDATION_ERROR`

### Hitos de la Fase 2
✅ **Hito 2.1**: Usuario puede registrarse exitosamente  
✅ **Hito 2.2**: Usuario puede hacer login y recibir JWT en cookie  
✅ **Hito 2.3**: Usuario puede obtener su perfil con token válido  
✅ **Hito 2.4**: Usuario puede actualizar su perfil  
✅ **Hito 2.5**: Usuario puede cambiar su password  
✅ **Hito 2.6**: Sistema rechaza tokens inválidos correctamente  
✅ **Hito 2.7**: Guards de autenticación y roles funcionan  
✅ **Hito 2.8**: UsersRepository implementado correctamente  
✅ **Hito 2.9**: Rate limiting funciona en login y registro

**Criterio de Finalización**: Sistema de autenticación completo con patrón Repository, funcional con todos los endpoints probados manualmente.

---

## Fase 3: Módulo de Productos y Categorías (Público)

**Objetivo**: Implementar endpoints públicos para listar productos y categorías.

### Tareas

#### 3.1 Módulo de Categorías (Público)
- [ ] Crear módulo `CategoriesModule`
- [ ] **NUEVO:** Crear `CategoriesRepository` extendiendo `BaseRepository`
  - Método `findAllWithHierarchy()` - retornar estructura de árbol
  - Método `findAllFlat()` - retornar lista plana
  - Método `findByIdWithChildren()` - incluir hijos
  - Método `findBySlug()`
  - Implementar queries optimizadas con eager loading
- [ ] Crear servicio `CategoriesService`
  - Inyectar `CategoriesRepository`
  - Lógica de construcción de jerarquía
- [ ] Crear controlador `CategoriesController`

#### 3.2 Endpoints de Categorías
- [ ] **GET /api/categories**
  - Implementar listado con jerarquía (estructura de árbol)
  - Implementar listado plano (flat=true)
  - Filtrar solo categorías activas por defecto
  - Permitir incluir inactivas con query param
  - Ordenar por campo `order`
  - Retornar con relación `children` recursiva
- [ ] **GET /api/categories/:id**
  - Buscar categoría por ID
  - Incluir categorías hijas
  - Retornar 404 si no existe

#### 3.3 DTOs de Categorías
- [ ] Crear `CategoryDto` para respuestas
- [ ] Crear `CategoryQueryDto` para query params

#### 3.4 Módulo de Productos (Público)
- [ ] Crear módulo `ProductsModule`
- [ ] **NUEVO:** Crear `ProductsRepository` extendiendo `BaseRepository`
  - Método `findAllWithFilters(filters)` - búsqueda avanzada
  - Método `findByIdWithRelations()` - incluir images, category, variants
  - Método `findBySlug()`
  - Método `findFeatured()` - productos destacados
  - Método `findByCategory(categoryId)`
  - Implementar queries optimizadas (N+1 prevention)
  - Método privado `buildWhereClause(filters)` - construcción dinámica de queries
- [ ] **NUEVO:** Crear domain services para lógica compleja
  - `ProductSearchService` - lógica de búsqueda y filtrado
  - `ProductPricingService` - cálculo de precios con descuento
- [ ] Crear servicio `ProductsService`
  - Inyectar `ProductsRepository` y domain services
  - Orquestar lógica de negocio
- [ ] Crear controlador `ProductsController`

#### 3.5 Endpoints de Productos
- [ ] **GET /api/products**
  - Implementar paginación (default: page=1, limit=12)
  - Implementar búsqueda por texto en name, description, shortDescription
  - Implementar filtros:
    - `category` (puede ser múltiple, separado por comas)
    - `minPrice`, `maxPrice`
    - `inStock` (boolean)
    - `isFeatured` (boolean)
    - `hasDiscount` (boolean)
  - Implementar ordenamiento:
    - `name-asc`, `name-desc`
    - `price-asc`, `price-desc`
    - `newest`, `oldest`
  - Solo productos con `isActive = true`
  - Incluir relaciones: `images`, `category`, `variants` con `options`
  - Retornar con metadata de paginación
- [ ] **GET /api/products/:id**
  - Buscar producto por ID
  - Incluir todas las relaciones (images, category, variants)
  - Ordenar imágenes por `order`
  - Retornar 404 si no existe
- [ ] **GET /api/products/slug/:slug**
  - Buscar producto por slug
  - Incluir todas las relaciones
  - Retornar 404 si no existe

#### 3.6 DTOs de Productos
- [ ] Crear `ProductDto` para respuestas
- [ ] Crear `ProductQueryDto` para query params y filtros
- [ ] Crear `PaginationDto` para metadatos de paginación

#### 3.7 Utilidades
- [ ] Crear función para construir query de búsqueda con Prisma
- [ ] Crear función para aplicar filtros dinámicamente
- [ ] Crear función para calcular metadata de paginación
- [ ] Crear interceptor para transformar respuestas con estructura estándar

### Hitos de la Fase 3
✅ **Hito 3.1**: Categorías se listan correctamente con jerarquía  
✅ **Hito 3.2**: Categoría individual se obtiene por ID  
✅ **Hito 3.3**: Productos se listan con paginación funcionando  
✅ **Hito 3.4**: Búsqueda de productos por texto funciona  
✅ **Hito 3.5**: Filtros de productos (categoría, precio, stock) funcionan  
✅ **Hito 3.6**: Ordenamiento de productos funciona  
✅ **Hito 3.7**: Producto individual se obtiene por ID y por slug  
✅ **Hito 3.8**: Imágenes y relaciones se incluyen correctamente  
✅ **Hito 3.9**: ProductsRepository y CategoriesRepository implementados  
✅ **Hito 3.10**: Domain services funcionando correctamente  
✅ **Hito 3.11**: Queries optimizadas sin N+1 problems

**Criterio de Finalización**: Endpoints públicos de productos y categorías funcionando con patrón Repository y Domain Services, queries optimizadas.

---

## Fase 4: Módulo de Carrito

**Objetivo**: Implementar gestión de carrito de compras en el backend.

### Tareas

#### 4.1 Configuración del Módulo
- [ ] Crear módulo `CartModule`
- [ ] **NUEVO:** Crear `CartRepository` extendiendo `BaseRepository`
  - Método `findByUserId(userId)` - incluir items con productos
  - Método `findOrCreate(userId)` - obtener o crear carrito
  - Método `addItem(cartId, productId, quantity)`
  - Método `updateItemQuantity(itemId, quantity)`
  - Método `removeItem(itemId)`
  - Método `clearCart(cartId)`
- [ ] **NUEVO:** Crear domain service `CartValidationService`
  - Validar stock antes de agregar
  - Validar producto activo
  - Validar que item pertenezca al usuario
- [ ] Crear servicio `CartService`
  - Inyectar `CartRepository` y `CartValidationService`
- [ ] Crear controlador `CartController`

#### 4.3 Endpoints de Carrito
- [ ] **GET /api/cart**
  - Proteger con `JwtAuthGuard`
  - Obtener carrito del usuario autenticado
  - Si no existe, crear uno vacío
  - Incluir items con relación a productos e imágenes
  - Retornar carrito completo
- [ ] **POST /api/cart/items**
  - Proteger con `JwtAuthGuard`
  - Validar que producto exista y esté activo
  - Validar stock disponible
  - Si item ya existe en carrito, incrementar cantidad
  - Si no existe, crear nuevo item
  - Retornar item creado/actualizado
- [ ] **PUT /api/cart/items/:itemId**
  - Proteger con `JwtAuthGuard`
  - Validar que item pertenezca al carrito del usuario
  - Validar nueva cantidad > 0
  - Validar stock disponible
  - Actualizar cantidad
  - Retornar item actualizado
- [ ] **DELETE /api/cart/items/:itemId**
  - Proteger con `JwtAuthGuard`
  - Validar que item pertenezca al carrito del usuario
  - Eliminar item del carrito
  - Retornar mensaje de éxito
- [ ] **DELETE /api/cart**
  - Proteger con `JwtAuthGuard`
  - Eliminar todos los items del carrito
  - Retornar mensaje de éxito

#### 4.4 DTOs de Carrito
- [ ] Crear `AddToCartDto` para agregar items
- [ ] Crear `UpdateCartItemDto` para actualizar cantidad
- [ ] Crear `CartDto` para respuestas

#### 4.5 Validaciones Específicas
- [ ] Validar que cantidad no exceda stock disponible
- [ ] Validar que producto esté activo
- [ ] Validar que item pertenezca al usuario actual (seguridad)

#### 4.6 Manejo de Errores
- [ ] Implementar error `INSUFFICIENT_STOCK` con detalles
- [ ] Implementar error `PRODUCT_NOT_FOUND`
- [ ] Implementar error `PRODUCT_INACTIVE`
- [ ] Implementar error `CART_ITEM_NOT_FOUND`

### Hitos de la Fase 4
✅ **Hito 4.1**: Usuario puede obtener su carrito (o crear uno nuevo)  
✅ **Hito 4.2**: Usuario puede agregar producto al carrito  
✅ **Hito 4.3**: Sistema valida stock antes de agregar  
✅ **Hito 4.4**: Usuario puede actualizar cantidad de un item  
✅ **Hito 4.5**: Usuario puede eliminar item del carrito  
✅ **Hito 4.6**: Usuario puede vaciar su carrito completamente  
✅ **Hito 4.7**: Carrito incluye información completa del producto  
✅ **Hito 4.8**: CartRepository implementado correctamente  
✅ **Hito 4.9**: CartValidationService separa lógica de validación

**Criterio de Finalización**: Sistema de carrito con patrón Repository y Domain Services, todas las validaciones funcionando.

---

## Fase 5: Módulo de Pedidos y Envío

**Objetivo**: Implementar creación de pedidos, gestión y cálculo de envío.

### Tareas

#### 5.1 Módulo de Envío
- [ ] Crear módulo `ShippingModule`
- [ ] **NUEVO:** Crear domain service `ShippingCalculationService`
  - Método `calculateShipping(subtotal)` - lógica de cálculo
  - Método `calculateFreeShippingRemaining(subtotal)`
  - Usar ConfigService para obtener thresholds
- [ ] Crear servicio `ShippingService` (orquestador)
  - Inyectar `ShippingCalculationService`
- [ ] Crear controlador `ShippingController`

#### 5.2 Endpoint de Cálculo de Envío
- [ ] **POST /api/shipping/calculate**
  - Endpoint público (no requiere autenticación)
  - Validar subtotal en request
  - Leer `FREE_SHIPPING_THRESHOLD` de variables de entorno
  - Leer `SHIPPING_COST` de variables de entorno
  - Si subtotal >= threshold → shipping = 0
  - Si no → shipping = SHIPPING_COST
  - Calcular cuánto falta para envío gratis
  - Retornar objeto con:
    - `shipping` (costo calculado)
    - `freeShippingThreshold`
    - `isFreeShipping`
    - `amountNeededForFreeShipping`

#### 5.3 DTOs de Envío
- [ ] Crear `CalculateShippingDto` para request
- [ ] Crear `ShippingResponseDto` para response

#### 5.4 Módulo de Pedidos
- [ ] Crear módulo `OrdersModule`
- [ ] **NUEVO:** Crear `OrdersRepository` extendiendo `BaseRepository`
  - Método `create(data)` - crear pedido con transacción
  - Método `findByUserId(userId, filters)` - con paginación
  - Método `findByIdWithRelations(id)` - incluir items, productos, usuario
  - Método `findByOrderNumber(orderNumber)`
  - Método `createWithTransaction(data)` - pedido + items + stock en transacción
- [ ] **NUEVO:** Crear domain services para lógica de pedidos
  - `OrderCalculationService` - cálculo de totales
    - Método `calculateSubtotal(items)`
    - Método `calculateTotal(subtotal, shipping)`
  - `OrderValidationService` - validaciones
    - Método `validateStock(items)`
    - Método `validateProductsActive(items)`
  - `OrderNumberGeneratorService` - generación de número único
    - Formato: `ORD-YYYY-MMDD-HHMMSS-XXX`
  - `StockManagementService` - gestión de stock
    - Método `decreaseStock(items)`
    - Método `increaseStock(items)` - para cancelaciones
    - Método `recordStockChange(changes)` - registrar en historial
- [ ] **NUEVO:** Crear eventos de pedidos
  - Evento `OrderCreatedEvent` - emitir al crear pedido
  - Evento `OrderStatusChangedEvent` - emitir al cambiar estado
- [ ] **NUEVO:** Crear listeners de eventos
  - `StockListener` - escucha `order.created` y descuenta stock
  - `CartListener` - escucha `order.created` y vacía carrito
- [ ] Crear servicio `OrdersService` (orquestador)
  - Inyectar: OrdersRepository, domain services, EventEmitter
  - Orquestar creación de pedido
  - Emitir eventos
- [ ] Crear controlador `OrdersController`

#### 5.6 Endpoints de Pedidos
- [ ] **POST /api/orders**
  - Proteger con `JwtAuthGuard`
  - Validar estructura de request:
    - `items[]` (productId, quantity)
    - `shippingAddress` (completo)
    - `paymentMethod`
    - `notes` (opcional)
  - Validar que todos los productos existan y estén activos
  - Validar stock disponible de todos los productos
  - Calcular subtotal (considerar discountPrice si existe)
  - Calcular shipping usando ShippingService
  - Calcular total
  - Generar orderNumber único
  - Crear transacción de base de datos:
    - Crear Order con estado `pending`
    - Crear OrderItems (capturar precio al momento)
    - Descontar stock de productos
    - Registrar cambios en StockHistory
    - Vaciar carrito del usuario (si existe)
  - Retornar pedido completo creado
- [ ] **GET /api/orders**
  - Proteger con `JwtAuthGuard`
  - Listar pedidos del usuario autenticado
  - Implementar paginación
  - Implementar filtro por estado
  - Implementar ordenamiento (newest/oldest)
  - Incluir items con productos e imágenes
  - Retornar con metadata de paginación
- [ ] **GET /api/orders/:id**
  - Proteger con `JwtAuthGuard`
  - Buscar pedido por ID
  - Validar que pedido pertenezca al usuario (403 si no)
  - Incluir todas las relaciones
  - Retornar pedido completo
- [ ] **GET /api/orders/number/:orderNumber**
  - Proteger con `JwtAuthGuard`
  - Buscar pedido por número de orden
  - Validar que pedido pertenezca al usuario (403 si no)
  - Retornar pedido completo

#### 5.7 DTOs de Pedidos
- [ ] Crear `CreateOrderDto` para crear pedido
- [ ] Crear `OrderItemDto` para items del pedido
- [ ] Crear `ShippingAddressDto` para dirección
- [ ] Crear `OrderDto` para respuestas
- [ ] Crear `OrderQueryDto` para filtros

#### 5.8 Validaciones y Errores
- [ ] Validar formato de todos los campos requeridos
- [ ] Implementar error `INSUFFICIENT_STOCK` con lista de productos
- [ ] Implementar error `PRODUCT_NOT_FOUND`
- [ ] Implementar error `PRODUCT_INACTIVE`
- [ ] Implementar error `ORDER_NOT_FOUND`
- [ ] Implementar error `FORBIDDEN` si pedido no pertenece al usuario

#### 5.9 Transacciones
- [ ] Asegurar que la creación de pedido sea transaccional
- [ ] Si algún paso falla, hacer rollback completo
- [ ] Registrar logs de errores en transacciones

### Hitos de la Fase 5
✅ **Hito 5.1**: Cálculo de envío funciona correctamente  
✅ **Hito 5.2**: Usuario puede crear pedido con items válidos  
✅ **Hito 5.3**: Sistema valida stock de todos los productos antes de crear pedido  
✅ **Hito 5.4**: Stock se descuenta correctamente al crear pedido  
✅ **Hito 5.5**: Historial de stock se registra correctamente  
✅ **Hito 5.6**: Número de orden se genera con formato correcto  
✅ **Hito 5.7**: Usuario puede listar sus pedidos con paginación  
✅ **Hito 5.8**: Usuario puede ver detalle de un pedido  
✅ **Hito 5.9**: Carrito se vacía automáticamente al crear pedido (vía evento)  
✅ **Hito 5.10**: Precio se captura correctamente al momento de compra  
✅ **Hito 5.11**: OrdersRepository implementado con transacciones  
✅ **Hito 5.12**: Domain services de pedidos separados correctamente  
✅ **Hito 5.13**: Event-driven architecture funcionando (eventos y listeners)  
✅ **Hito 5.14**: Módulos desacoplados mediante eventos

**Criterio de Finalización**: Sistema de pedidos con arquitectura event-driven, Repository pattern, Domain Services, transaccionalidad y validaciones completas.

---

## Fase 6: Panel Admin - Productos y Categorías

**Objetivo**: Implementar CRUD completo para gestión de productos y categorías desde el admin.

### Tareas

#### 6.1 Configuración de Módulos Admin
- [ ] Crear módulo `AdminProductsModule` en `src/modules/admin/admin-products/`
- [ ] **NUEVO:** Crear `AdminProductsRepository` (reusar o extender ProductsRepository)
  - Método `findAllIncludingInactive(filters)`
  - Método `updateWithStockHistory(id, data)` - actualizar y registrar
- [ ] **NUEVO:** Crear domain services admin
  - `SlugGeneratorService` - generar slugs únicos
  - `ProductImageService` - validar imagen principal única
  - `ProductValidationService` - validar SKU único, categoría existe
- [ ] Crear servicio `AdminProductsService`
  - Inyectar repository y domain services
- [ ] Crear controlador `AdminProductsController`
- [ ] Crear módulo `AdminCategoriesModule` en `src/modules/admin/admin-categories/`
- [ ] **NUEVO:** Crear `AdminCategoriesRepository`
  - Método `findAllIncludingInactive()`
  - Método `checkDependencies(id)` - verificar productos y hijos
  - Método `validateNoCircularReference(id, parentId)` - prevenir ciclos
- [ ] **NUEVO:** Crear domain service `CategoryHierarchyService`
  - Validar jerarquía sin ciclos
  - Verificar dependencias antes de eliminar
- [ ] Crear servicio `AdminCategoriesService`
- [ ] Crear controlador `AdminCategoriesController`

#### 6.2 Endpoints Admin - Productos
- [ ] **GET /api/admin/products**
  - Proteger con `JwtAuthGuard` + `RolesGuard` (admin)
  - Listar todos los productos (incluir inactivos)
  - Implementar filtros:
    - `search` (texto)
    - `category`
    - `isActive`
    - `isFeatured`
    - `lowStock` (stock < threshold)
    - `outOfStock` (stock = 0)
  - Implementar paginación
  - Implementar ordenamiento
  - Retornar con metadata
- [ ] **GET /api/admin/products/:id**
  - Proteger con admin guard
  - Obtener producto por ID (incluir inactivos)
  - Incluir todas las relaciones
  - Retornar producto completo
- [ ] **POST /api/admin/products**
  - Proteger con admin guard
  - Validar todos los campos requeridos:
    - `name`, `description`, `sku`, `price`, `stock`, `categoryId`
    - `images[]` (al menos 1)
  - Validar que SKU sea único
  - Validar que categoryId exista
  - Generar slug automáticamente desde name
  - Si slug existe, agregar sufijo numérico
  - Si discountPercentage se proporciona, calcular discountPrice
  - Asegurar que solo 1 imagen tenga isPrimary=true
  - Crear producto con todas sus relaciones:
    - ProductImages
    - ProductVariants y VariantOptions (si aplica)
  - Retornar producto creado
- [ ] **PUT /api/admin/products/:id**
  - Proteger con admin guard
  - Actualización parcial (todos los campos opcionales)
  - Validar SKU único (si se actualiza)
  - Si se actualiza name, regenerar slug
  - Si se actualiza discountPercentage o price, recalcular discountPrice
  - Si se actualiza stock, registrar en StockHistory
  - Actualizar imágenes (crear nuevas, actualizar existentes)
  - Actualizar variantes (crear nuevas, actualizar existentes)
  - Retornar producto actualizado
- [ ] **DELETE /api/admin/products/:id**
  - Proteger con admin guard
  - Implementar soft delete (marcar isActive=false)
  - Alternativamente: verificar que no haya pedidos asociados antes de eliminar
  - Retornar mensaje de éxito

#### 6.3 Endpoint Especial - Stock
- [ ] **PUT /api/admin/products/:id/stock**
  - Proteger con admin guard
  - Validar nuevo valor de stock >= 0
  - Obtener stock actual
  - Actualizar stock
  - Registrar cambio en StockHistory con:
    - `previousStock`
    - `newStock`
    - `reason` (del request body)
    - `productName`
  - Retornar información de actualización

#### 6.4 DTOs Admin - Productos
- [ ] Crear `CreateProductDto` con todas las validaciones
- [ ] Crear `UpdateProductDto` (Partial de CreateProductDto)
- [ ] Crear `UpdateStockDto` para actualización de stock
- [ ] Crear `CreateProductImageDto`
- [ ] Crear `CreateProductVariantDto`
- [ ] Crear `AdminProductQueryDto` para filtros admin

#### 6.5 Endpoints Admin - Categorías
- [ ] **GET /api/admin/categories**
  - Proteger con admin guard
  - Listar todas las categorías (incluir inactivas por defecto)
  - Implementar estructura jerárquica o plana según query
  - Retornar categorías
- [ ] **POST /api/admin/categories**
  - Proteger con admin guard
  - Validar campos requeridos: `name`
  - Validar parentId si se proporciona
  - Generar slug automáticamente desde name
  - Si slug existe, agregar sufijo numérico
  - Crear categoría
  - Retornar categoría creada
- [ ] **PUT /api/admin/categories/:id**
  - Proteger con admin guard
  - Actualización parcial
  - Si se actualiza name, regenerar slug
  - Si se actualiza parentId, validar que no cree ciclo
  - Retornar categoría actualizada
- [ ] **DELETE /api/admin/categories/:id**
  - Proteger con admin guard
  - Verificar que no tenga productos asociados
  - Verificar que no tenga categorías hijas
  - Si tiene dependencias, retornar error 409 con detalles
  - Si no tiene dependencias, eliminar
  - Retornar mensaje de éxito

#### 6.6 DTOs Admin - Categorías
- [ ] Crear `CreateCategoryDto`
- [ ] Crear `UpdateCategoryDto`
- [ ] Crear `AdminCategoryQueryDto`

#### 6.7 Utilidades Admin
- [ ] Crear función para generar slug único
- [ ] Crear función para validar ciclos en jerarquía de categorías
- [ ] Crear función para verificar dependencias de categorías

#### 6.8 Validaciones y Errores Admin
- [ ] Error `SKU_DUPLICATE` (409)
- [ ] Error `CATEGORY_NOT_FOUND` (404)
- [ ] Error `PRODUCT_NOT_FOUND` (404)
- [ ] Error `CATEGORY_HAS_DEPENDENCIES` (409) con detalles
- [ ] Error `INVALID_PARENT_CATEGORY` (400) si crea ciclo

### Hitos de la Fase 6
✅ **Hito 6.1**: Admin puede listar todos los productos con filtros  
✅ **Hito 6.2**: Admin puede crear nuevo producto con imágenes  
✅ **Hito 6.3**: Slug se genera automáticamente y es único (SlugGeneratorService)  
✅ **Hito 6.4**: Admin puede actualizar producto existente  
✅ **Hito 6.5**: Admin puede actualizar solo el stock de un producto  
✅ **Hito 6.6**: Cambios de stock se registran en historial automáticamente  
✅ **Hito 6.7**: Admin puede eliminar producto (soft delete)  
✅ **Hito 6.8**: Admin puede crear categoría  
✅ **Hito 6.9**: Admin puede actualizar categoría  
✅ **Hito 6.10**: Sistema previene eliminación de categorías con productos  
✅ **Hito 6.11**: Sistema previene ciclos en jerarquía (CategoryHierarchyService)  
✅ **Hito 6.12**: Solo usuarios con role admin pueden acceder  
✅ **Hito 6.13**: AdminProductsRepository y AdminCategoriesRepository implementados  
✅ **Hito 6.14**: Domain services admin funcionando correctamente

**Criterio de Finalización**: Panel admin con Repository pattern y Domain Services, todas las validaciones funcionando.

---

## Fase 7: Panel Admin - Pedidos y Stock

**Objetivo**: Implementar gestión de pedidos y visualización de historial de stock para admin.

### Tareas

#### 7.1 Configuración de Módulos
- [ ] Crear módulo `AdminOrdersModule` en `src/modules/admin/admin-orders/`
- [ ] **NUEVO:** Crear `AdminOrdersRepository` (extender OrdersRepository)
  - Método `findAllWithFilters(filters)` - todos los usuarios
  - Método `calculateSummary(filters)` - estadísticas
  - Método `updateStatus(id, status)`
- [ ] **NUEVO:** Crear domain services admin de pedidos
  - `OrderStatusValidationService` - validar transiciones de estado
    - Método `validateStatusTransition(currentStatus, newStatus)`
  - `OrderSummaryService` - calcular estadísticas
    - Método `calculateRevenue(orders)`
    - Método `calculateAverageOrderValue(orders)`
- [ ] **NUEVO:** Crear eventos de cambio de estado
  - Evento `OrderStatusChangedEvent`
  - Listener `StockReturnListener` - devolver stock si se cancela
- [ ] Crear servicio `AdminOrdersService`
  - Inyectar repository, domain services, EventEmitter
- [ ] Crear controlador `AdminOrdersController`
- [ ] Crear módulo `AdminStockModule` en `src/modules/admin/admin-stock/`
- [ ] **NUEVO:** Crear `StockHistoryRepository`
  - Método `findAll(filters)`
  - Método `findByProductId(productId, filters)`
- [ ] Crear servicio `AdminStockService`
- [ ] Crear controlador `AdminStockController`

#### 7.2 Endpoints Admin - Pedidos
- [ ] **GET /api/admin/orders**
  - Proteger con admin guard
  - Listar todos los pedidos de todos los usuarios
  - Implementar filtros:
    - `status` (estado del pedido)
    - `userId` (filtrar por usuario específico)
    - `search` (buscar por orderNumber, email, nombre)
    - `dateFrom`, `dateTo` (rango de fechas)
    - `minTotal`, `maxTotal` (rango de totales)
    - `paymentMethod`
  - Implementar paginación
  - Implementar ordenamiento:
    - `newest`, `oldest`
    - `total-asc`, `total-desc`
  - Incluir información del usuario (email, nombre)
  - Incluir items con productos
  - Calcular y retornar resumen estadístico:
    - `totalOrders`
    - `totalRevenue`
    - `averageOrderValue`
    - `ordersByStatus` (contador por cada estado)
  - Retornar pedidos con metadata y resumen
- [ ] **GET /api/admin/orders/:id**
  - Proteger con admin guard
  - Obtener pedido por ID (de cualquier usuario)
  - Incluir todas las relaciones
  - Incluir información del usuario
  - Retornar pedido completo
- [ ] **PUT /api/admin/orders/:id/status**
  - Proteger con admin guard
  - Validar nuevo estado en request
  - Validar transición de estado válida:
    - No se puede pasar de shipped/delivered a cancelled
    - No se puede retroceder desde delivered
  - Si se cambia a `cancelled`, considerar devolver stock (opcional)
  - Actualizar estado del pedido
  - Actualizar `updatedAt`
  - Opcionalmente agregar notas sobre el cambio
  - Retornar pedido actualizado

#### 7.3 Lógica de Estados de Pedidos
- [ ] Implementar función de validación de flujo de estados
  - Estados válidos: pending → confirmed → processing → shipped → delivered
  - Cancelación permitida solo antes de shipped
- [ ] Implementar función de devolución de stock (opcional)
  - Si se cancela un pedido, devolver stock a productos
  - Registrar en StockHistory con reason "Pedido cancelado"

#### 7.4 DTOs Admin - Pedidos
- [ ] Crear `UpdateOrderStatusDto`
- [ ] Crear `AdminOrderQueryDto` con todos los filtros
- [ ] Crear `OrderSummaryDto` para resumen estadístico

#### 7.5 Endpoints Admin - Stock
- [ ] **GET /api/admin/stock/history**
  - Proteger con admin guard
  - Listar historial de cambios de stock de todos los productos
  - Implementar filtros:
    - `productId` (filtrar por producto específico)
    - `dateFrom`, `dateTo` (rango de fechas)
  - Implementar paginación
  - Implementar ordenamiento (newest/oldest)
  - Retornar historial con metadata
- [ ] **GET /api/admin/stock/history/:productId**
  - Proteger con admin guard
  - Listar historial de cambios de un producto específico
  - Implementar filtros de fecha
  - Implementar paginación
  - Retornar historial con metadata
- [ ] **PUT /api/admin/stock/threshold** (opcional)
  - Proteger con admin guard
  - Configurar umbral global de stock bajo
  - Validar threshold >= 0
  - Guardar en variable de entorno o tabla de configuración
  - Retornar threshold actualizado

#### 7.6 DTOs Admin - Stock
- [ ] Crear `StockHistoryQueryDto` para filtros
- [ ] Crear `UpdateStockThresholdDto` (opcional)

#### 7.7 Validaciones y Errores Admin
- [ ] Error `INVALID_STATUS_TRANSITION` con detalles de estado actual y solicitado
- [ ] Error `ORDER_NOT_FOUND`
- [ ] Error `PRODUCT_NOT_FOUND` para historial de stock

### Hitos de la Fase 7
✅ **Hito 7.1**: Admin puede listar todos los pedidos con filtros  
✅ **Hito 7.2**: Admin puede buscar pedidos por texto  
✅ **Hito 7.3**: Admin puede filtrar pedidos por fecha, estado, total  
✅ **Hito 7.4**: Admin puede ver resumen estadístico (OrderSummaryService)  
✅ **Hito 7.5**: Admin puede ver detalle completo de cualquier pedido  
✅ **Hito 7.6**: Admin puede actualizar estado de un pedido  
✅ **Hito 7.7**: Sistema valida transiciones de estado (OrderStatusValidationService)  
✅ **Hito 7.8**: Admin puede ver historial de stock general  
✅ **Hito 7.9**: Admin puede ver historial de stock de un producto  
✅ **Hito 7.10**: Historial muestra cambios de stock con razón y fechas  
✅ **Hito 7.11**: Solo usuarios admin pueden acceder a estos endpoints  
✅ **Hito 7.12**: AdminOrdersRepository y StockHistoryRepository implementados  
✅ **Hito 7.13**: Event-driven para cancelación de pedidos (devolución de stock)

**Criterio de Finalización**: Panel admin con Repository pattern, Domain Services y eventos, filtros avanzados funcionando.

---

## Fase 8: Documentación y Optimización

**Objetivo**: Generar documentación completa con Swagger y optimizar el rendimiento del backend.

### Tareas

#### 8.1 Configuración de Swagger
- [ ] Configurar SwaggerModule en `main.ts`
- [ ] Definir metadata general del API:
  - Título: "Snacks E-commerce API"
  - Descripción
  - Versión
  - Información de contacto
- [ ] Configurar autenticación en Swagger (Bearer token / Cookies)
- [ ] Definir tags para agrupar endpoints:
  - Auth
  - Products
  - Categories
  - Cart
  - Orders
  - Shipping
  - Admin - Products
  - Admin - Categories
  - Admin - Orders
  - Admin - Stock

#### 8.2 Decoradores de Swagger
- [ ] Agregar `@ApiTags()` en todos los controladores
- [ ] Agregar `@ApiOperation()` en todos los endpoints con descripción
- [ ] Agregar `@ApiResponse()` para respuestas exitosas y errores
- [ ] Agregar `@ApiProperty()` en todos los DTOs
- [ ] Agregar `@ApiBearerAuth()` en endpoints protegidos
- [ ] Agregar `@ApiQuery()` para query parameters
- [ ] Agregar `@ApiParam()` para path parameters
- [ ] Agregar ejemplos de respuesta con `@ApiResponseExample()`

#### 8.3 Validación de Documentación
- [ ] Verificar que todos los endpoints estén documentados
- [ ] Verificar que todos los DTOs tengan ejemplos
- [ ] Verificar que códigos de error estén documentados
- [ ] Probar endpoints desde la UI de Swagger
- [ ] Exportar schema OpenAPI en JSON/YAML

#### 8.4 Health Check y Monitoreo
- [ ] **Configurar TerminusModule de @nestjs/terminus**
- [ ] Crear módulo `HealthModule` en `src/health/`
- [ ] Crear `HealthController` con endpoint `GET /health`
  - Health indicator de base de datos (Prisma)
  - Health indicator de memoria
  - Health indicator de disco
  - Retornar status agregado: healthy/unhealthy
  - Incluir detalles de cada indicator
  - Timestamp de verificación
- [ ] Crear endpoint `GET /health/ready`
  - Verificar que la app esté lista para recibir tráfico
- [ ] Crear endpoint `GET /health/live`
  - Verificar que la app esté viva
- [ ] Crear endpoint `GET /api/version`
  - Retornar versión del API (desde package.json)
  - Retornar información del ambiente
  - Retornar timestamp de deploy

#### 8.5 Optimización de Queries
- [ ] Revisar queries de Prisma y optimizar eager loading
- [ ] Agregar índices faltantes en base de datos
- [ ] Implementar select específico en lugar de cargar todos los campos
- [ ] Optimizar query de listado de productos (N+1 query problem)
- [ ] Optimizar query de listado de pedidos

#### 8.6 Verificación de Interceptores y Middleware
- [ ] Verificar que interceptor de logging funcione correctamente
  - Logs estructurados en producción
  - Información completa: método, ruta, duración, status, userId
- [ ] Verificar interceptor de transformación
  - Todas las respuestas en formato estándar
  - Manejo correcto de errores
- [ ] Verificar compression middleware
- [ ] Verificar rate limiting en todos los endpoints sensibles
  - Login: 5 intentos por 15 minutos
  - Registro: 3 intentos por hora
  - Admin endpoints: 200 por 15 minutos
- [ ] Revisar configuración de timeouts (30s por request)

#### 8.7 Manejo Global de Errores
- [ ] Crear filtro de excepciones global
- [ ] Mapear excepciones de Prisma a errores HTTP apropiados
- [ ] Agregar códigos de error internos consistentes
- [ ] Loggear errores 500 con stack trace
- [ ] Sanitizar errores en producción (no exponer stack trace)

#### 8.8 Validaciones Adicionales
- [ ] Revisar todas las validaciones de DTOs
- [ ] Agregar mensajes de error personalizados en español
- [ ] Implementar validadores personalizados si es necesario

#### 8.9 README y Documentación
- [ ] Actualizar README.md con:
  - Descripción del proyecto
  - Requisitos previos
  - Instrucciones de instalación
  - Configuración de variables de entorno
  - Comandos de desarrollo
  - Comandos de migración y seeds
  - Comandos de build y producción
  - Acceso a Swagger
  - Estructura del proyecto
- [ ] Crear CONTRIBUTING.md (opcional)
- [ ] Crear CHANGELOG.md

### Hitos de la Fase 8
✅ **Hito 8.1**: Swagger configurado y accesible en `/api/docs`  
✅ **Hito 8.2**: Todos los endpoints documentados en Swagger  
✅ **Hito 8.3**: DTOs tienen decoradores de Swagger con ejemplos  
✅ **Hito 8.4**: Respuestas y errores documentados correctamente  
✅ **Hito 8.5**: Health checks funcionando con Terminus (/health, /health/ready, /health/live)  
✅ **Hito 8.6**: Queries optimizadas sin N+1 problems  
✅ **Hito 8.7**: Interceptores de logging y transformación verificados  
✅ **Hito 8.8**: Rate limiting verificado en todos los endpoints sensibles  
✅ **Hito 8.9**: Manejo global de errores funcionando correctamente  
✅ **Hito 8.10**: README completo con arquitectura documentada  
✅ **Hito 8.11**: Documentación de patrones arquitectónicos (Repository, Domain Services, Events)

**Criterio de Finalización**: API completamente documentada, optimizada, con health checks completos y documentación de arquitectura.

---

## Fase 9: Despliegue a Producción

**Objetivo**: Preparar y desplegar el backend a un ambiente de producción.

### Tareas

#### 9.1 Preparación para Producción
- [ ] Crear archivo `.env.production` con variables de producción
- [ ] Configurar `NODE_ENV=production`
- [ ] Revisar y ajustar configuración de CORS para dominio de producción
- [ ] Configurar `secure: true` en cookies para HTTPS
- [ ] Ajustar configuración de rate limiting para producción
- [ ] Revisar logs y eliminar logs de debug

#### 9.2 Selección de Plataforma de Hosting
Opciones recomendadas:
- [ ] **Railway** (recomendado para MVP)
  - Fácil setup
  - PostgreSQL incluido
  - Deploy automático desde GitHub
- [ ] **Render**
  - Free tier disponible
  - PostgreSQL incluido
- [ ] **AWS** (para mayor control)
  - EC2 + RDS
  - Más configuración requerida

#### 9.3 Configuración de Base de Datos
- [ ] Crear instancia de PostgreSQL en producción
- [ ] Obtener `DATABASE_URL` de producción
- [ ] Ejecutar migraciones en base de datos de producción
  ```bash
  npx prisma migrate deploy
  ```
- [ ] Ejecutar seeds en base de datos de producción
  ```bash
  npx prisma db seed
  ```
- [ ] Verificar que datos iniciales existan (admin, categorías)

#### 9.4 Configuración de Variables de Entorno
- [ ] Configurar todas las variables en la plataforma de hosting:
  - `DATABASE_URL`
  - `JWT_SECRET` (generar uno nuevo seguro)
  - `JWT_EXPIRES_IN`
  - `COOKIE_SECRET` (generar uno nuevo seguro)
  - `FREE_SHIPPING_THRESHOLD`
  - `SHIPPING_COST`
  - `CORS_ORIGIN` (dominio del frontend en producción)
  - `PORT` (usualmente proporcionado por la plataforma)
  - `NODE_ENV=production`
- [ ] Si se usa Cloudinary o S3:
  - Configurar credenciales de cloud storage

#### 9.5 Build y Deploy
- [ ] Configurar script de build en `package.json`
  ```json
  "build": "nest build"
  ```
- [ ] Configurar script de start para producción
  ```json
  "start:prod": "node dist/main"
  ```
- [ ] Hacer build local para verificar
  ```bash
  npm run build
  ```
- [ ] Configurar deploy automático desde rama `main` de GitHub
- [ ] Realizar primer deploy
- [ ] Verificar que el servidor esté corriendo

#### 9.6 Verificación Post-Deploy
- [ ] Verificar que `/health` responda correctamente
- [ ] Verificar que `/api/docs` (Swagger) sea accesible
- [ ] Probar endpoint de login con usuario admin
- [ ] Probar endpoint de registro de nuevo usuario
- [ ] Probar listado de productos
- [ ] Probar listado de categorías
- [ ] Verificar que cookies se establezcan correctamente (HttpOnly, Secure)

#### 9.7 Configuración de Dominio (Opcional)
- [ ] Adquirir dominio personalizado
- [ ] Configurar DNS para apuntar a servidor
- [ ] Configurar SSL/TLS (usualmente automático en Railway/Render)
- [ ] Actualizar `CORS_ORIGIN` con dominio personalizado
- [ ] Verificar HTTPS funcionando

#### 9.8 Monitoreo y Logs
- [ ] Configurar monitoreo de uptime (UptimeRobot, Pingdom)
- [ ] Configurar alertas de downtime
- [ ] Configurar servicio de tracking de errores (Sentry, opcional)
- [ ] Revisar logs de la aplicación en plataforma de hosting
- [ ] Configurar retención de logs

#### 9.9 Backup y Recuperación
- [ ] Configurar backups automáticos de base de datos
- [ ] Documentar proceso de restauración
- [ ] Probar proceso de restauración (en ambiente de staging si es posible)

#### 9.10 Documentación de Deploy
- [ ] Crear documento DEPLOYMENT.md con:
  - Requisitos de producción
  - Pasos de deploy
  - Variables de entorno necesarias
  - Comandos de migración
  - Proceso de rollback
  - Troubleshooting común
- [ ] Actualizar README con URL de producción
- [ ] Documentar credenciales de admin en lugar seguro

### Hitos de la Fase 9
✅ **Hito 9.1**: Base de datos de producción creada y migrada  
✅ **Hito 9.2**: Variables de entorno configuradas en producción  
✅ **Hito 9.3**: Build exitoso y aplicación desplegada  
✅ **Hito 9.4**: Health check responde correctamente  
✅ **Hito 9.5**: Swagger accesible en producción  
✅ **Hito 9.6**: Login y autenticación funcionando en producción  
✅ **Hito 9.7**: CORS configurado correctamente con frontend  
✅ **Hito 9.8**: Cookies HTTPS configuradas correctamente  
✅ **Hito 9.9**: Monitoreo de uptime configurado  
✅ **Hito 9.10**: Backups de base de datos configurados

**Criterio de Finalización**: Backend completamente funcional en producción, accesible desde el frontend, con monitoreo activo y backups configurados.

---

## 📈 Resumen de Progreso

### Resumen por Fase

| Fase | Nombre | Estado | Hitos |
|------|--------|--------|-------|
| 0 | Configuración Inicial | ⏳ Pendiente | 10 hitos |
| 1 | Base de Datos y Modelos | ⏳ Pendiente | 6 hitos |
| 2 | Sistema de Autenticación | ⏳ Pendiente | 9 hitos |
| 3 | Productos y Categorías (Público) | ⏳ Pendiente | 11 hitos |
| 4 | Módulo de Carrito | ⏳ Pendiente | 9 hitos |
| 5 | Pedidos y Envío | ⏳ Pendiente | 14 hitos |
| 6 | Admin - Productos y Categorías | ⏳ Pendiente | 14 hitos |
| 7 | Admin - Pedidos y Stock | ⏳ Pendiente | 13 hitos |
| 8 | Documentación y Optimización | ⏳ Pendiente | 11 hitos |
| 9 | Despliegue a Producción | ⏳ Pendiente | 10 hitos |

**Total de Hitos**: 107 hitos principales

**Hitos adicionales por arquitectura mejorada**: +22 hitos para implementar:
- Patrón Repository en todos los módulos
- Domain Services para lógica de negocio
- Event-Driven Architecture
- Interceptores y Filtros Globales
- Health Checks completos
- Rate Limiting
- Configuración centralizada

---

## 🎯 Estrategia de Desarrollo Recomendada

### Enfoque Incremental

Este proyecto está diseñado para ser desarrollado de manera incremental:

1. **Fases 0-2**: Fundamentos (configuración, base de datos, autenticación)
   - Resultado: Sistema de usuarios funcional
   - Tiempo estimado: Fase base

2. **Fase 3**: Primera funcionalidad visible para usuarios
   - Resultado: Catálogo de productos navegable
   - Integrable con frontend desde aquí

3. **Fases 4-5**: Funcionalidad core del e-commerce
   - Resultado: Usuarios pueden comprar
   - Sistema funcional de extremo a extremo

4. **Fases 6-7**: Herramientas administrativas
   - Resultado: Admin puede gestionar el negocio
   - Backend completamente funcional

5. **Fases 8-9**: Profesionalización y producción
   - Resultado: Sistema listo para usuarios reales

### Puntos de Integración con Frontend

- **Después de Fase 2**: Frontend puede implementar login/registro
- **Después de Fase 3**: Frontend puede mostrar catálogo de productos
- **Después de Fase 4**: Frontend puede gestionar carrito
- **Después de Fase 5**: Frontend puede procesar pedidos completos
- **Después de Fase 6**: Panel admin funcional para productos
- **Después de Fase 7**: Panel admin completo

### Recomendaciones

1. **No saltar fases**: Cada fase depende de las anteriores
2. **Verificar hitos**: Asegurar que todos los hitos de una fase estén completos antes de continuar
3. **Probar manualmente**: Usar herramientas como Postman/Insomnia para probar cada endpoint
4. **Commits frecuentes**: Hacer commits al finalizar cada tarea o sub-sección
5. **Documentar problemas**: Anotar decisiones técnicas importantes y problemas encontrados

---

## 🔧 Herramientas Recomendadas para Desarrollo

### Esenciales
- **IDE**: Visual Studio Code con extensiones de NestJS y Prisma
- **Cliente HTTP**: Postman o Insomnia para probar endpoints
- **Cliente de BD**: Prisma Studio (incluido) o DBeaver
- **Control de versiones**: Git + GitHub

### Útiles
- **Thunder Client**: Extensión de VSCode (alternativa ligera a Postman)
- **REST Client**: Extensión de VSCode para archivos `.http`
- **Prisma VSCode Extension**: Autocompletado para schemas
- **ESLint + Prettier**: Formateo y linting automático

---

## 📝 Notas Finales

### Consideraciones Importantes

1. **Tests**: Esta planificación NO incluye tests por solicitud explícita. Para un proyecto de producción real, se recomienda agregar tests después de tener funcionalidad estable.

2. **Seguridad**: Todas las fases incluyen consideraciones de seguridad:
   - Rate limiting configurado
   - Filtros de excepciones globales
   - Validación exhaustiva con DTOs
   - Guards de autenticación y autorización
   - Cookies HttpOnly y Secure

3. **Arquitectura SOLID**: El proyecto implementa:
   - ✅ **Single Responsibility**: Domain Services especializados
   - ✅ **Open/Closed**: Event-Driven Architecture permite extensión sin modificación
   - ✅ **Liskov Substitution**: Interfaces de Repository bien definidas
   - ✅ **Interface Segregation**: DTOs específicos por caso de uso
   - ✅ **Dependency Inversion**: Patrón Repository desacopla lógica de BD

4. **Escalabilidad**: La arquitectura permite escalar fácilmente:
   - **Repository Pattern**: Fácil cambiar de ORM o agregar sharding
   - **Event-Driven**: Fácil migrar a microservicios con message queues (RabbitMQ, Redis)
   - **Domain Services**: Fácil extraer a servicios independientes
   - **Configuración Centralizada**: Fácil adaptar a diferentes ambientes
   - **Para futuro considerar**: Caché con Redis, Load balancer, CDN, Database replicas

5. **Mantenibilidad**: La arquitectura facilita el mantenimiento:
   - Código modular y desacoplado
   - Lógica de negocio centralizada en Domain Services
   - Fácil de testear (mock de repositorios)
   - Logging estructurado
   - Health checks para monitoreo

### Próximos Pasos Sugeridos

Una vez completado este backend:
1. Implementar refresh tokens para JWT
2. Agregar sistema de notificaciones por email
3. Agregar panel de analytics para admin
4. Implementar webhooks para integraciones
5. Agregar soporte para cupones de descuento
6. Implementar wishlist de productos
7. Agregar reviews y ratings de productos

---

## 🚀 Oportunidades de Mejora Futuras

Esta sección documenta mejoras avanzadas que pueden implementarse en fases futuras para optimizar el rendimiento, observabilidad y escalabilidad del sistema.

### 1. **Caché con Redis** 🔴 (Prioridad: Media-Alta)

**Objetivo**: Mejorar significativamente el rendimiento y reducir la carga en la base de datos.

**Casos de Uso**:
- Cachear listados de productos (GET /api/products)
- Cachear categorías con jerarquía (GET /api/categories)
- Cachear información de productos individuales
- Cachear configuraciones del sistema
- Cachear resultados de búsquedas frecuentes
- Sesiones de usuario (alternativa a JWT)

**Implementación Sugerida**:
```bash
npm install @nestjs/cache-manager cache-manager
npm install cache-manager-redis-store
```

**Beneficios Esperados**:
- ⚡ Reducción de latencia: 80-95% en endpoints cacheados
- 📉 Reducción de carga en BD: 60-80%
- 💰 Reducción de costos de infraestructura
- 🚀 Mejor experiencia de usuario

**Estrategia de Invalidación**:
- Cache-aside pattern
- TTL de 5-15 minutos para productos
- TTL de 30 minutos para categorías
- Invalidación manual al actualizar desde admin
- Event-driven cache invalidation (escuchar eventos de actualización)

**Integración con Arquitectura Actual**:
```typescript
// Ejemplo de implementación en ProductsService
@Injectable()
export class ProductsService {
  constructor(
    private readonly productsRepository: ProductsRepository,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async getProduct(id: string) {
    const cacheKey = `product:${id}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;
    
    const product = await this.productsRepository.findById(id);
    await this.cacheManager.set(cacheKey, product, { ttl: 600 });
    return product;
  }

  @OnEvent('product.updated')
  async invalidateProductCache(productId: string) {
    await this.cacheManager.del(`product:${productId}`);
  }
}
```

---

### 2. **Monitoreo con Prometheus + Grafana** 📊 (Prioridad: Alta para Producción)

**Objetivo**: Obtener visibilidad completa del comportamiento del sistema en tiempo real.

**Métricas a Monitorear**:

**Métricas de Aplicación**:
- Requests por segundo (RPS)
- Latencia de endpoints (p50, p95, p99)
- Tasa de errores por endpoint
- Tasa de éxito de autenticación
- Pedidos creados por minuto/hora
- Productos más visitados
- Usuarios activos

**Métricas de Sistema**:
- Uso de CPU y memoria
- Conexiones de base de datos (pool)
- Queries lentas (> 1s)
- Event emitter queue size
- Rate limiting hits

**Métricas de Negocio**:
- Ingresos por hora/día
- Valor promedio de pedidos
- Tasa de conversión (carritos → pedidos)
- Productos con bajo stock
- Pedidos por estado

**Implementación Sugerida**:
```bash
npm install @willsoto/nestjs-prometheus prom-client
```

**Setup de Grafana**:
- Dashboards predefinidos para APIs REST
- Alertas automáticas:
  - Latencia > 2s
  - Error rate > 5%
  - CPU > 80%
  - Memoria > 90%
  - Stock crítico de productos

**Beneficios Esperados**:
- 🔍 Detección proactiva de problemas
- 📈 Optimización basada en datos reales
- 🚨 Alertas antes de que los usuarios se vean afectados
- 📊 Métricas de negocio en tiempo real
- 🎯 Identificación de cuellos de botella

---

### 3. **Tracing Distribuido con OpenTelemetry** 🔎 (Prioridad: Media)

**Objetivo**: Rastrear requests completos a través de todos los servicios y dependencias para debugging avanzado.

**Casos de Uso**:
- Debugging de requests lentos
- Identificar qué parte del flujo causa latencia
- Rastrear transacciones de pedidos completas:
  - Request → Validación → BD → Stock → Eventos → Response
- Correlación de logs entre servicios
- Análisis de dependencias entre servicios

**Implementación Sugerida**:
```bash
npm install @opentelemetry/sdk-node
npm install @opentelemetry/auto-instrumentations-node
npm install @opentelemetry/exporter-jaeger
```

**Qué se Rastrea Automáticamente**:
- HTTP requests/responses
- Database queries (Prisma)
- External API calls
- Event emissions
- Redis operations (cuando se implemente)

**Visualización**:
- Jaeger UI o Grafana Tempo
- Flame graphs de requests
- Dependency graphs
- Error tracking con contexto completo

**Ejemplo de Vista de Trace**:
```
POST /api/orders [285ms]
  ├─ OrdersService.create [280ms]
  │   ├─ OrderValidationService.validateStock [45ms]
  │   │   └─ Prisma: SELECT products [42ms]
  │   ├─ OrderCalculationService.calculateTotal [2ms]
  │   ├─ OrdersRepository.createWithTransaction [215ms]
  │   │   └─ Prisma: BEGIN ... COMMIT [212ms]
  │   └─ EventEmitter.emit('order.created') [1ms]
  └─ StockListener.handleOrderCreated [18ms]
      └─ StockService.decreaseStock [15ms]
```

**Beneficios Esperados**:
- 🐛 Debugging 10x más rápido
- 🔍 Visibilidad end-to-end de requests
- 📊 Identificación precisa de cuellos de botella
- 🎯 Optimización basada en datos reales
- 🚀 Preparación para arquitectura de microservicios

---

### Roadmap de Implementación Sugerido

**Fase Post-MVP (después del despliegue inicial)**:

1. **Mes 1-2**: Implementar Prometheus + Grafana
   - Crítico para monitorear el sistema en producción
   - Configurar alertas básicas
   - Crear dashboards de métricas clave

2. **Mes 2-3**: Implementar Caché con Redis
   - Implementar para endpoints más frecuentes
   - Medir mejora de rendimiento
   - Ajustar estrategias de TTL

3. **Mes 3-4**: Implementar OpenTelemetry
   - Útil cuando el sistema crezca en complejidad
   - Valioso para optimización avanzada
   - Preparación para eventual migración a microservicios

**Criterios para Priorizar**:
- ✅ Implementar Prometheus/Grafana cuando se despliegue a producción
- ✅ Implementar Redis cuando la latencia > 500ms o carga BD > 70%
- ✅ Implementar OpenTelemetry cuando se tenga más de 3 servicios/módulos complejos interactuando

---

**Versión del Documento**: 2.0  
**Fecha de Creación**: 2026-02-04  
**Última Actualización**: 2026-02-04

**Changelog v2.0**:
- ✅ Agregado patrón Repository en todos los módulos
- ✅ Agregados Domain Services para lógica de negocio
- ✅ Implementada arquitectura Event-Driven (eventos y listeners)
- ✅ Agregados interceptores globales (logging, transform, timeout)
- ✅ Agregados filtros de excepciones globales
- ✅ Configuración centralizada y modular
- ✅ Rate limiting configurado
- ✅ Health checks con @nestjs/terminus
- ✅ Estructura de carpetas expandida y organizada
- ✅ Total de hitos incrementado de 85 a 107
- ✅ Agregada sección de Oportunidades de Mejora Futuras

Para comenzar el desarrollo, ir a [Fase 0: Configuración Inicial del Proyecto](#fase-0-configuración-inicial-del-proyecto)
