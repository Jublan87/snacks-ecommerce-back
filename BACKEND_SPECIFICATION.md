# 📘 Especificación Técnica del Backend - Snacks E-commerce

> **Documento de referencia para el desarrollo del backend**
> 
> Este documento detalla todos los endpoints, entidades de base de datos, y reglas de negocio necesarias para implementar el backend del e-commerce de snacks, completamente alineado con el frontend desde el momento cero.

---

## 📋 Tabla de Contenidos

1. [Introducción](#introducción)
2. [Stack Tecnológico Recomendado](#stack-tecnológico-recomendado)
3. [Autenticación y Seguridad](#autenticación-y-seguridad)
4. [Entidades de Base de Datos](#entidades-de-base-de-datos)
5. [Especificación de Endpoints](#especificación-de-endpoints)
   - [Autenticación](#endpoints-autenticación)
   - [Productos (Público)](#endpoints-productos-público)
   - [Categorías](#endpoints-categorías)
   - [Carrito](#endpoints-carrito)
   - [Pedidos](#endpoints-pedidos)
   - [Envío](#endpoints-envío)
   - [Admin - Productos](#endpoints-admin-productos)
   - [Admin - Categorías](#endpoints-admin-categorías)
   - [Admin - Pedidos](#endpoints-admin-pedidos)
   - [Admin - Stock](#endpoints-admin-stock)
6. [Reglas de Negocio](#reglas-de-negocio)
7. [Códigos de Estado HTTP](#códigos-de-estado-http)
8. [Variables de Entorno](#variables-de-entorno)
9. [Notas de Implementación](#notas-de-implementación)

---

## Introducción

Este documento especifica la API REST necesaria para el backend del e-commerce de snacks. El frontend está desarrollado en Next.js 15 y espera esta API para funcionar completamente.

### Convenciones

- Todos los endpoints usan JSON para request y response
- Las fechas se envían y reciben en formato ISO 8601 (ej: `"2024-01-15T10:30:00.000Z"`)
- Los IDs son strings UUID v4
- La autenticación se maneja mediante JWT almacenado en cookies HttpOnly
- Los endpoints admin requieren role `admin`

---

## Stack Tecnológico Recomendado

### Backend
- **Framework**: NestJS (TypeScript)
- **Base de datos**: PostgreSQL 14+
- **ORM**: Prisma
- **Autenticación**: JWT (jsonwebtoken o passport-jwt)
- **Validación**: class-validator + class-transformer
- **Documentación**: Swagger/OpenAPI

### Infraestructura (Sugerida)
- **Hosting Backend**: Railway / Render / AWS
- **Base de datos**: Railway / Supabase / AWS RDS
- **Storage de imágenes**: Cloudinary / AWS S3
- **Variables de entorno**: dotenv

---

## Autenticación y Seguridad

### Método de Autenticación

El sistema usa **JWT (JSON Web Tokens)** con las siguientes características:

- **Almacenamiento**: Cookie HttpOnly con nombre `auth-token`
- **Expiración**: 7 días (configurable)
- **Refresh**: Opcional (recomendado implementar refresh tokens)

### Estructura del JWT Payload

```typescript
{
  userId: string;      // UUID del usuario
  email: string;       // Email del usuario
  role: 'customer' | 'admin';  // Rol del usuario
  iat: number;         // Issued at (timestamp)
  exp: number;         // Expiration (timestamp)
}
```

### Protección de Rutas

#### Rutas Públicas (sin autenticación)
- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/products`
- `GET /api/products/:id`
- `GET /api/products/slug/:slug`
- `GET /api/categories`
- `GET /api/categories/:id`
- `POST /api/shipping/calculate`

#### Rutas Protegidas (requieren autenticación)
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `PUT /api/auth/profile`
- `PUT /api/auth/password`
- `GET /api/cart`
- `POST /api/cart/items`
- `PUT /api/cart/items/:itemId`
- `DELETE /api/cart/items/:itemId`
- `DELETE /api/cart`
- `POST /api/orders`
- `GET /api/orders`
- `GET /api/orders/:id`

#### Rutas Admin (requieren role `admin`)
- Todos los endpoints bajo `/api/admin/*`

### Configuración de Cookies

```typescript
{
  httpOnly: true,      // No accesible desde JavaScript
  secure: true,        // Solo HTTPS en producción
  sameSite: 'strict',  // Protección CSRF
  maxAge: 604800000,   // 7 días en milisegundos
  path: '/'
}
```

---

## Entidades de Base de Datos

### Diagrama de Relaciones

```
User (1) ──────< (N) Order
User (1) ──────< (N) Cart
                      Cart (1) ──────< (N) CartItem
                                          CartItem (N) >────── (1) Product
Order (1) ──────< (N) OrderItem
                      OrderItem (N) >────── (1) Product
Product (N) >────── (1) Category
                         Category (1) ──────< (N) Category (self-reference)
Product (1) ──────< (N) ProductImage
Product (1) ──────< (N) ProductVariant
                         ProductVariant (1) ──────< (N) VariantOption
Product (1) ──────< (N) StockHistory
```

---

### 1. User (Usuarios)

**Tabla**: `users`

| Campo            | Tipo      | Constraints                      | Descripción                        |
|------------------|-----------|----------------------------------|------------------------------------|
| id               | UUID      | PRIMARY KEY, DEFAULT uuid_v4()   | ID único del usuario               |
| email            | VARCHAR   | UNIQUE, NOT NULL                 | Email del usuario (único)          |
| password         | VARCHAR   | NOT NULL                         | Password hasheado (bcrypt)         |
| firstName        | VARCHAR   | NOT NULL                         | Nombre del usuario                 |
| lastName         | VARCHAR   | NOT NULL                         | Apellido del usuario               |
| phone            | VARCHAR   | NULL                             | Teléfono del usuario               |
| role             | ENUM      | NOT NULL, DEFAULT 'customer'     | Rol: 'customer' o 'admin'          |
| shippingAddress  | JSONB     | NULL                             | Dirección de envío (estructura abajo) |
| createdAt        | TIMESTAMP | DEFAULT NOW()                    | Fecha de creación                  |
| updatedAt        | TIMESTAMP | DEFAULT NOW()                    | Fecha de última actualización      |

**Estructura de `shippingAddress` (JSONB)**:
```typescript
{
  address: string;
  city: string;
  province: string;
  postalCode: string;
  notes?: string;
}
```

**Índices**:
- `email` (UNIQUE)
- `role`

**Usuario admin por defecto** (crear en seed):
```json
{
  "email": "admin@snacks.com",
  "password": "Admin-123",  // Hashear con bcrypt
  "firstName": "Admin",
  "lastName": "Sistema",
  "role": "admin"
}
```

---

### 2. Category (Categorías)

**Tabla**: `categories`

| Campo       | Tipo      | Constraints                    | Descripción                          |
|-------------|-----------|--------------------------------|--------------------------------------|
| id          | UUID      | PRIMARY KEY, DEFAULT uuid_v4() | ID único de la categoría             |
| name        | VARCHAR   | NOT NULL                       | Nombre de la categoría               |
| slug        | VARCHAR   | UNIQUE, NOT NULL               | URL-friendly name                    |
| description | TEXT      | NULL                           | Descripción de la categoría          |
| parentId    | UUID      | FOREIGN KEY → categories(id), NULL | ID de categoría padre (jerarquía) |
| image       | VARCHAR   | NULL                           | URL de imagen de la categoría        |
| order       | INTEGER   | NOT NULL, DEFAULT 0            | Orden de visualización               |
| isActive    | BOOLEAN   | NOT NULL, DEFAULT true         | Si la categoría está activa          |
| createdAt   | TIMESTAMP | DEFAULT NOW()                  | Fecha de creación                    |
| updatedAt   | TIMESTAMP | DEFAULT NOW()                  | Fecha de última actualización        |

**Índices**:
- `slug` (UNIQUE)
- `parentId`
- `isActive`

**Relaciones**:
- `parentId` → `categories.id` (self-reference, permite jerarquía)

**Ejemplos de datos iniciales** (seed):
```json
[
  { "name": "Dulces", "slug": "dulces", "order": 1 },
  { "name": "Salados", "slug": "salados", "order": 2 },
  { "name": "Bebidas", "slug": "bebidas", "order": 3 },
  { "name": "Chocolates", "slug": "chocolates", "order": 4 }
]
```

---

### 3. Product (Productos)

**Tabla**: `products`

| Campo              | Tipo      | Constraints                    | Descripción                          |
|--------------------|-----------|--------------------------------|--------------------------------------|
| id                 | UUID      | PRIMARY KEY, DEFAULT uuid_v4() | ID único del producto                |
| name               | VARCHAR   | NOT NULL                       | Nombre del producto                  |
| slug               | VARCHAR   | UNIQUE, NOT NULL               | URL-friendly name                    |
| description        | TEXT      | NOT NULL                       | Descripción completa                 |
| shortDescription   | VARCHAR   | NULL                           | Descripción corta                    |
| sku                | VARCHAR   | UNIQUE, NOT NULL               | SKU del producto                     |
| price              | DECIMAL   | NOT NULL                       | Precio regular                       |
| discountPrice      | DECIMAL   | NULL                           | Precio con descuento                 |
| discountPercentage | INTEGER   | NULL                           | Porcentaje de descuento (0-100)      |
| stock              | INTEGER   | NOT NULL, DEFAULT 0            | Stock disponible                     |
| categoryId         | UUID      | FOREIGN KEY → categories(id), NOT NULL | ID de categoría             |
| specifications     | JSONB     | NULL                           | Especificaciones técnicas            |
| isActive           | BOOLEAN   | NOT NULL, DEFAULT true         | Si el producto está activo           |
| isFeatured         | BOOLEAN   | NOT NULL, DEFAULT false        | Si es producto destacado             |
| tags               | TEXT[]    | NULL                           | Etiquetas del producto               |
| weight             | DECIMAL   | NULL                           | Peso en gramos                       |
| dimensions         | JSONB     | NULL                           | Dimensiones (estructura abajo)       |
| createdAt          | TIMESTAMP | DEFAULT NOW()                  | Fecha de creación                    |
| updatedAt          | TIMESTAMP | DEFAULT NOW()                  | Fecha de última actualización        |

**Estructura de `dimensions` (JSONB)**:
```typescript
{
  width: number;   // Ancho en cm
  height: number;  // Alto en cm
  depth: number;   // Profundidad en cm
}
```

**Estructura de `specifications` (JSONB)**:
```typescript
{
  [key: string]: string;
}
// Ejemplo:
{
  "Peso neto": "250g",
  "Ingredientes": "Harina, azúcar, chocolate",
  "Marca": "Snacks Premium"
}
```

**Índices**:
- `slug` (UNIQUE)
- `sku` (UNIQUE)
- `categoryId`
- `isActive`
- `isFeatured`

**Reglas de negocio**:
- Si `discountPercentage` está presente, calcular `discountPrice = price * (1 - discountPercentage / 100)`
- El `slug` debe generarse automáticamente desde `name` (lowercase, sin espacios, con guiones)
- El `stock` no puede ser negativo

---

### 4. ProductImage (Imágenes de Productos)

**Tabla**: `product_images`

| Campo     | Tipo      | Constraints                    | Descripción                          |
|-----------|-----------|--------------------------------|--------------------------------------|
| id        | UUID      | PRIMARY KEY, DEFAULT uuid_v4() | ID único de la imagen                |
| productId | UUID      | FOREIGN KEY → products(id), NOT NULL | ID del producto              |
| url       | VARCHAR   | NOT NULL                       | URL de la imagen                     |
| alt       | VARCHAR   | NOT NULL                       | Texto alternativo                    |
| isPrimary | BOOLEAN   | NOT NULL, DEFAULT false        | Si es la imagen principal            |
| order     | INTEGER   | NOT NULL, DEFAULT 0            | Orden de visualización               |
| createdAt | TIMESTAMP | DEFAULT NOW()                  | Fecha de creación                    |

**Índices**:
- `productId`
- Índice compuesto: `(productId, isPrimary)` (para buscar imagen principal rápido)

**Relaciones**:
- `productId` → `products.id` (CASCADE on delete)

**Regla de negocio**:
- Solo una imagen puede tener `isPrimary = true` por producto

---

### 5. ProductVariant (Variantes de Productos)

**Tabla**: `product_variants`

| Campo     | Tipo      | Constraints                    | Descripción                          |
|-----------|-----------|--------------------------------|--------------------------------------|
| id        | UUID      | PRIMARY KEY, DEFAULT uuid_v4() | ID único de la variante              |
| productId | UUID      | FOREIGN KEY → products(id), NOT NULL | ID del producto              |
| name      | VARCHAR   | NOT NULL                       | Nombre de la variante (ej: "Tamaño") |
| createdAt | TIMESTAMP | DEFAULT NOW()                  | Fecha de creación                    |

**Índices**:
- `productId`

**Relaciones**:
- `productId` → `products.id` (CASCADE on delete)

---

### 6. VariantOption (Opciones de Variantes)

**Tabla**: `variant_options`

| Campo         | Tipo      | Constraints                    | Descripción                          |
|---------------|-----------|--------------------------------|--------------------------------------|
| id            | UUID      | PRIMARY KEY, DEFAULT uuid_v4() | ID único de la opción                |
| variantId     | UUID      | FOREIGN KEY → product_variants(id), NOT NULL | ID de la variante    |
| value         | VARCHAR   | NOT NULL                       | Valor de la opción (ej: "250g")      |
| priceModifier | DECIMAL   | NULL                           | Modificador de precio (+/-)          |
| stock         | INTEGER   | NOT NULL, DEFAULT 0            | Stock de esta variante               |
| sku           | VARCHAR   | NULL                           | SKU específico de la variante        |
| createdAt     | TIMESTAMP | DEFAULT NOW()                  | Fecha de creación                    |

**Índices**:
- `variantId`
- `sku` (UNIQUE si no es NULL)

**Relaciones**:
- `variantId` → `product_variants.id` (CASCADE on delete)

---

### 7. Cart (Carrito de Compras)

**Tabla**: `carts`

| Campo     | Tipo      | Constraints                    | Descripción                          |
|-----------|-----------|--------------------------------|--------------------------------------|
| id        | UUID      | PRIMARY KEY, DEFAULT uuid_v4() | ID único del carrito                 |
| userId    | UUID      | FOREIGN KEY → users(id), NOT NULL, UNIQUE | ID del usuario           |
| createdAt | TIMESTAMP | DEFAULT NOW()                  | Fecha de creación                    |
| updatedAt | TIMESTAMP | DEFAULT NOW()                  | Fecha de última actualización        |

**Índices**:
- `userId` (UNIQUE - un carrito por usuario)

**Relaciones**:
- `userId` → `users.id` (CASCADE on delete)

**Nota**: El carrito puede persistirse en el backend o manejarse solo en frontend (localStorage). Si se implementa en backend, permite sincronización entre dispositivos.

---

### 8. CartItem (Items del Carrito)

**Tabla**: `cart_items`

| Campo     | Tipo      | Constraints                    | Descripción                          |
|-----------|-----------|--------------------------------|--------------------------------------|
| id        | UUID      | PRIMARY KEY, DEFAULT uuid_v4() | ID único del item                    |
| cartId    | UUID      | FOREIGN KEY → carts(id), NOT NULL | ID del carrito                    |
| productId | UUID      | FOREIGN KEY → products(id), NOT NULL | ID del producto                |
| quantity  | INTEGER   | NOT NULL, DEFAULT 1            | Cantidad de productos                |
| addedAt   | TIMESTAMP | DEFAULT NOW()                  | Fecha en que se agregó               |

**Índices**:
- `cartId`
- `productId`
- Índice compuesto: `(cartId, productId)` (UNIQUE - un producto por carrito)

**Relaciones**:
- `cartId` → `carts.id` (CASCADE on delete)
- `productId` → `products.id` (CASCADE on delete)

**Regla de negocio**:
- La `quantity` debe ser mayor a 0
- Validar que `quantity` no exceda el `stock` disponible del producto

---

### 9. Order (Pedidos)

**Tabla**: `orders`

| Campo           | Tipo      | Constraints                    | Descripción                          |
|-----------------|-----------|--------------------------------|--------------------------------------|
| id              | UUID      | PRIMARY KEY, DEFAULT uuid_v4() | ID único del pedido                  |
| orderNumber     | VARCHAR   | UNIQUE, NOT NULL               | Número de orden legible              |
| userId          | UUID      | FOREIGN KEY → users(id), NOT NULL | ID del usuario                    |
| shippingAddress | JSONB     | NOT NULL                       | Dirección de envío (estructura abajo)|
| paymentMethod   | ENUM      | NOT NULL                       | Método de pago                       |
| subtotal        | DECIMAL   | NOT NULL                       | Subtotal sin envío                   |
| shipping        | DECIMAL   | NOT NULL                       | Costo de envío                       |
| total           | DECIMAL   | NOT NULL                       | Total (subtotal + shipping)          |
| status          | ENUM      | NOT NULL, DEFAULT 'pending'    | Estado del pedido                    |
| notes           | TEXT      | NULL                           | Notas adicionales                    |
| createdAt       | TIMESTAMP | DEFAULT NOW()                  | Fecha de creación                    |
| updatedAt       | TIMESTAMP | DEFAULT NOW()                  | Fecha de última actualización        |

**ENUM `paymentMethod`**: 
- `'credit_card'`
- `'debit_card'`
- `'cash_on_delivery'`
- `'bank_transfer'`

**ENUM `status`**:
- `'pending'` - Pendiente
- `'confirmed'` - Confirmado
- `'processing'` - En proceso
- `'shipped'` - Enviado
- `'delivered'` - Entregado
- `'cancelled'` - Cancelado

**Estructura de `shippingAddress` (JSONB)**:
```typescript
{
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  notes?: string;
}
```

**Índices**:
- `orderNumber` (UNIQUE)
- `userId`
- `status`
- `createdAt` (para ordenamiento)

**Relaciones**:
- `userId` → `users.id` (NO CASCADE - mantener pedidos si se elimina usuario)

**Formato de `orderNumber`**:
```
ORD-YYYY-MMDD-HHMMSS-XXX
Ejemplo: ORD-2024-0115-143025-001
```

**Reglas de negocio**:
- El `orderNumber` debe generarse automáticamente usando el formato especificado
- Los estados siguen un flujo: pending → confirmed → processing → shipped → delivered
- Solo admin puede cambiar el estado de un pedido
- No se puede cambiar un pedido a `cancelled` si el estado es `shipped` o `delivered`

---

### 10. OrderItem (Items del Pedido)

**Tabla**: `order_items`

| Campo     | Tipo      | Constraints                    | Descripción                          |
|-----------|-----------|--------------------------------|--------------------------------------|
| id        | UUID      | PRIMARY KEY, DEFAULT uuid_v4() | ID único del item                    |
| orderId   | UUID      | FOREIGN KEY → orders(id), NOT NULL | ID del pedido                     |
| productId | UUID      | FOREIGN KEY → products(id), NOT NULL | ID del producto                |
| quantity  | INTEGER   | NOT NULL                       | Cantidad comprada                    |
| price     | DECIMAL   | NOT NULL                       | Precio unitario al momento de compra |
| subtotal  | DECIMAL   | NOT NULL                       | Subtotal (quantity * price)          |
| createdAt | TIMESTAMP | DEFAULT NOW()                  | Fecha de creación                    |

**Índices**:
- `orderId`
- `productId`

**Relaciones**:
- `orderId` → `orders.id` (CASCADE on delete)
- `productId` → `products.id` (NO CASCADE - mantener referencia histórica)

**Regla de negocio**:
- El `price` captura el precio del producto al momento de la compra (usar `discountPrice` si existe, sino `price`)
- El `subtotal` se calcula como `quantity * price`
- Al crear un pedido, el stock del producto debe disminuir en la cantidad comprada

---

### 11. StockHistory (Historial de Stock)

**Tabla**: `stock_history`

| Campo         | Tipo      | Constraints                    | Descripción                          |
|---------------|-----------|--------------------------------|--------------------------------------|
| id            | UUID      | PRIMARY KEY, DEFAULT uuid_v4() | ID único del registro                |
| productId     | UUID      | FOREIGN KEY → products(id), NOT NULL | ID del producto                |
| productName   | VARCHAR   | NOT NULL                       | Nombre del producto (denormalizado)  |
| previousStock | INTEGER   | NOT NULL                       | Stock anterior                       |
| newStock      | INTEGER   | NOT NULL                       | Nuevo stock                          |
| reason        | VARCHAR   | NULL                           | Razón del cambio                     |
| createdAt     | TIMESTAMP | DEFAULT NOW()                  | Fecha del cambio                     |

**Índices**:
- `productId`
- `createdAt`

**Relaciones**:
- `productId` → `products.id` (NO CASCADE - mantener historial)

**Regla de negocio**:
- Cada vez que se actualiza el stock de un producto, registrar en esta tabla
- Opcional: limitar el historial a los últimos 500 registros por producto

---

## Especificación de Endpoints

### Convenciones Generales

#### Headers

**Request (cuando aplique)**:
```
Content-Type: application/json
Cookie: auth-token=<JWT_TOKEN>
```

**Response**:
```
Content-Type: application/json
```

#### Estructura de Response Exitoso

```typescript
{
  success: true,
  data: any,
  message?: string
}
```

#### Estructura de Response de Error

```typescript
{
  success: false,
  error: {
    code: string,        // Código de error interno
    message: string,     // Mensaje legible para el usuario
    details?: any        // Detalles adicionales (opcional)
  }
}
```

---

## Endpoints: Autenticación

### 1. Login

**POST** `/api/auth/login`

Autentica un usuario y devuelve un JWT en una cookie HttpOnly.

**Request Body**:
```typescript
{
  email: string;      // Email del usuario
  password: string;   // Password en texto plano
}
```

**Validaciones**:
- `email`: requerido, formato email válido
- `password`: requerido, mínimo 6 caracteres

**Response exitoso (200)**:
```typescript
{
  success: true,
  data: {
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      phone?: string;
      shippingAddress?: {
        address: string;
        city: string;
        province: string;
        postalCode: string;
        notes?: string;
      };
      role: 'customer' | 'admin';
      createdAt: string;  // ISO 8601
    },
    token: string;  // JWT token
  },
  message: "Inicio de sesión exitoso"
}
```

**Set-Cookie Header**:
```
auth-token=<JWT_TOKEN>; HttpOnly; Secure; SameSite=Strict; Max-Age=604800; Path=/
```

**Errores**:
- `401 Unauthorized`: Credenciales inválidas
  ```typescript
  {
    success: false,
    error: {
      code: "INVALID_CREDENTIALS",
      message: "Email o contraseña incorrectos"
    }
  }
  ```
- `400 Bad Request`: Datos de entrada inválidos
  ```typescript
  {
    success: false,
    error: {
      code: "VALIDATION_ERROR",
      message: "Datos inválidos",
      details: {
        email: ["El email es requerido"],
        password: ["La contraseña debe tener al menos 6 caracteres"]
      }
    }
  }
  ```

---

### 2. Registro

**POST** `/api/auth/register`

Registra un nuevo usuario.

**Request Body**:
```typescript
{
  email: string;
  password: string;      // Mínimo 8 caracteres, al menos 1 mayúscula, 1 minúscula, 1 número
  confirmPassword: string;  // Debe coincidir con password
  firstName: string;
  lastName: string;
  phone?: string;        // Opcional
  shippingAddress?: {    // Opcional
    address: string;
    city: string;
    province: string;
    postalCode: string;
    notes?: string;
  };
}
```

**Validaciones**:
- `email`: requerido, formato válido, único en la BD
- `password`: requerido, mínimo 8 caracteres, debe contener al menos 1 mayúscula, 1 minúscula, 1 número
- `confirmPassword`: debe coincidir con `password`
- `firstName`: requerido, máximo 50 caracteres
- `lastName`: requerido, máximo 50 caracteres
- `phone`: opcional, formato válido si se proporciona
- `shippingAddress`: si se proporciona, todos sus campos son requeridos

**Response exitoso (201)**:
```typescript
{
  success: true,
  data: {
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      phone?: string;
      shippingAddress?: {
        address: string;
        city: string;
        province: string;
        postalCode: string;
        notes?: string;
      };
      role: 'customer';  // Siempre customer en registro
      createdAt: string;
    },
    token: string;
  },
  message: "Usuario registrado exitosamente"
}
```

**Set-Cookie Header**: (igual que login)

**Errores**:
- `409 Conflict`: Email ya existe
  ```typescript
  {
    success: false,
    error: {
      code: "EMAIL_EXISTS",
      message: "El email ya está registrado"
    }
  }
  ```
- `400 Bad Request`: Datos de entrada inválidos

---

### 3. Logout

**POST** `/api/auth/logout`

**Autenticación**: Requerida

Cierra la sesión del usuario y elimina la cookie de autenticación.

**Request Body**: No requiere

**Response exitoso (200)**:
```typescript
{
  success: true,
  message: "Sesión cerrada exitosamente"
}
```

**Set-Cookie Header**:
```
auth-token=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/
```

**Errores**:
- `401 Unauthorized`: Token inválido o expirado

---

### 4. Obtener Usuario Actual

**GET** `/api/auth/me`

**Autenticación**: Requerida

Obtiene la información del usuario autenticado.

**Response exitoso (200)**:
```typescript
{
  success: true,
  data: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    shippingAddress?: {
      address: string;
      city: string;
      province: string;
      postalCode: string;
      notes?: string;
    };
    role: 'customer' | 'admin';
    createdAt: string;
  }
}
```

**Errores**:
- `401 Unauthorized`: Token inválido o expirado

---

### 5. Actualizar Perfil

**PUT** `/api/auth/profile`

**Autenticación**: Requerida

Actualiza la información del perfil del usuario autenticado.

**Request Body**:
```typescript
{
  firstName?: string;
  lastName?: string;
  phone?: string;
  shippingAddress?: {
    address: string;
    city: string;
    province: string;
    postalCode: string;
    notes?: string;
  };
}
```

**Validaciones**:
- Todos los campos son opcionales
- Si se proporciona `shippingAddress`, todos sus campos son requeridos

**Response exitoso (200)**:
```typescript
{
  success: true,
  data: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    shippingAddress?: {
      address: string;
      city: string;
      province: string;
      postalCode: string;
      notes?: string;
    };
    role: 'customer' | 'admin';
    createdAt: string;
  },
  message: "Perfil actualizado exitosamente"
}
```

**Errores**:
- `401 Unauthorized`: Token inválido o expirado
- `400 Bad Request`: Datos de entrada inválidos

---

### 6. Cambiar Contraseña

**PUT** `/api/auth/password`

**Autenticación**: Requerida

Cambia la contraseña del usuario autenticado.

**Request Body**:
```typescript
{
  currentPassword: string;
  newPassword: string;        // Mínimo 8 caracteres, con validaciones
  confirmNewPassword: string; // Debe coincidir con newPassword
}
```

**Validaciones**:
- `currentPassword`: requerido
- `newPassword`: requerido, mínimo 8 caracteres, debe contener al menos 1 mayúscula, 1 minúscula, 1 número
- `confirmNewPassword`: debe coincidir con `newPassword`

**Response exitoso (200)**:
```typescript
{
  success: true,
  message: "Contraseña actualizada exitosamente"
}
```

**Errores**:
- `401 Unauthorized`: Token inválido o contraseña actual incorrecta
  ```typescript
  {
    success: false,
    error: {
      code: "INVALID_PASSWORD",
      message: "La contraseña actual es incorrecta"
    }
  }
  ```
- `400 Bad Request`: Datos de entrada inválidos

---

### 7. Verificar Token

**GET** `/api/auth/verify`

**Autenticación**: Requerida

Verifica si el token JWT es válido.

**Response exitoso (200)**:
```typescript
{
  success: true,
  data: {
    valid: true,
    userId: string;
    email: string;
    role: 'customer' | 'admin';
  }
}
```

**Errores**:
- `401 Unauthorized`: Token inválido o expirado
  ```typescript
  {
    success: false,
    error: {
      code: "INVALID_TOKEN",
      message: "Token inválido o expirado"
    }
  }
  ```

---

## Endpoints: Productos (Público)

### 1. Listar Productos

**GET** `/api/products`

**Autenticación**: No requerida

Lista todos los productos con soporte para filtrado, búsqueda, ordenamiento y paginación.

**Query Parameters**:
```typescript
{
  search?: string;         // Búsqueda por nombre o descripción
  category?: string;       // ID de categoría (puede ser múltiple separado por comas)
  minPrice?: number;       // Precio mínimo
  maxPrice?: number;       // Precio máximo
  inStock?: boolean;       // Solo productos con stock > 0
  isFeatured?: boolean;    // Solo productos destacados
  hasDiscount?: boolean;   // Solo productos con descuento
  sort?: string;           // Ordenamiento (ver opciones abajo)
  page?: number;           // Número de página (default: 1)
  limit?: number;          // Items por página (default: 12, max: 100)
}
```

**Opciones de `sort`**:
- `name-asc`: Ordenar por nombre ascendente (A-Z)
- `name-desc`: Ordenar por nombre descendente (Z-A)
- `price-asc`: Ordenar por precio ascendente (menor a mayor)
- `price-desc`: Ordenar por precio descendente (mayor a menor)
- `newest`: Ordenar por fecha de creación descendente (más reciente primero)
- `oldest`: Ordenar por fecha de creación ascendente (más antiguo primero)
- Default: `newest`

**Ejemplo de Request**:
```
GET /api/products?search=chocolate&category=dulces&sort=price-asc&page=1&limit=12
```

**Response exitoso (200)**:
```typescript
{
  success: true,
  data: {
    products: [
      {
        id: string;
        name: string;
        slug: string;
        description: string;
        shortDescription?: string;
        sku: string;
        price: number;
        discountPrice?: number;
        discountPercentage?: number;
        stock: number;
        images: [
          {
            id: string;
            url: string;
            alt: string;
            isPrimary: boolean;
            order: number;
          }
        ];
        categoryId: string;
        category: {
          id: string;
          name: string;
          slug: string;
          description?: string;
          parentId?: string;
          image?: string;
          order: number;
          isActive: boolean;
        };
        variants?: [
          {
            id: string;
            name: string;
            options: [
              {
                id: string;
                value: string;
                priceModifier?: number;
                stock: number;
                sku?: string;
              }
            ];
          }
        ];
        specifications?: {
          [key: string]: string;
        };
        isActive: boolean;
        isFeatured: boolean;
        tags: string[];
        weight?: number;
        dimensions?: {
          width: number;
          height: number;
          depth: number;
        };
        createdAt: string;
        updatedAt: string;
      }
    ],
    pagination: {
      page: number;          // Página actual
      limit: number;         // Items por página
      totalItems: number;    // Total de items encontrados
      totalPages: number;    // Total de páginas
      hasNextPage: boolean;  // Si hay página siguiente
      hasPrevPage: boolean;  // Si hay página anterior
    }
  }
}
```

**Notas**:
- Solo devolver productos con `isActive = true`
- Las imágenes deben estar ordenadas por `order` ascendente
- La búsqueda debe ser case-insensitive y buscar en `name`, `description` y `shortDescription`
- Si `category` contiene múltiples IDs separados por comas, hacer OR entre ellos

**Errores**:
- `400 Bad Request`: Parámetros de query inválidos

---

### 2. Obtener Producto por ID

**GET** `/api/products/:id`

**Autenticación**: No requerida

Obtiene un producto específico por su ID.

**Path Parameters**:
- `id`: UUID del producto

**Response exitoso (200)**:
```typescript
{
  success: true,
  data: {
    id: string;
    name: string;
    slug: string;
    description: string;
    shortDescription?: string;
    sku: string;
    price: number;
    discountPrice?: number;
    discountPercentage?: number;
    stock: number;
    images: [
      {
        id: string;
        url: string;
        alt: string;
        isPrimary: boolean;
        order: number;
      }
    ];
    categoryId: string;
    category: {
      id: string;
      name: string;
      slug: string;
      description?: string;
      parentId?: string;
      image?: string;
      order: number;
      isActive: boolean;
    };
    variants?: [
      {
        id: string;
        name: string;
        options: [
          {
            id: string;
            value: string;
            priceModifier?: number;
            stock: number;
            sku?: string;
          }
        ];
      }
    ];
    specifications?: {
      [key: string]: string;
    };
    isActive: boolean;
    isFeatured: boolean;
    tags: string[];
    weight?: number;
    dimensions?: {
      width: number;
      height: number;
      depth: number;
    };
    createdAt: string;
    updatedAt: string;
  }
}
```

**Errores**:
- `404 Not Found`: Producto no encontrado
  ```typescript
  {
    success: false,
    error: {
      code: "PRODUCT_NOT_FOUND",
      message: "Producto no encontrado"
    }
  }
  ```

---

### 3. Obtener Producto por Slug

**GET** `/api/products/slug/:slug`

**Autenticación**: No requerida

Obtiene un producto específico por su slug (URL-friendly name).

**Path Parameters**:
- `slug`: Slug del producto (ej: `chocolate-premium-250g`)

**Response exitoso (200)**: Igual que `GET /api/products/:id`

**Errores**:
- `404 Not Found`: Producto no encontrado

---

## Endpoints: Categorías

### 1. Listar Categorías

**GET** `/api/categories`

**Autenticación**: No requerida

Lista todas las categorías con soporte para jerarquía.

**Query Parameters**:
```typescript
{
  includeInactive?: boolean;  // Incluir categorías inactivas (default: false)
  parentId?: string;          // Filtrar por categoría padre (null para raíz)
  flat?: boolean;             // Retornar plano sin jerarquía (default: false)
}
```

**Response exitoso (200) - Con jerarquía (flat=false)**:
```typescript
{
  success: true,
  data: [
    {
      id: string;
      name: string;
      slug: string;
      description?: string;
      parentId?: string | null;
      children: [  // Categorías hijas (recursivo)
        {
          id: string;
          name: string;
          slug: string;
          description?: string;
          parentId: string;
          children: [...];
          image?: string;
          order: number;
          isActive: boolean;
        }
      ];
      image?: string;
      order: number;
      isActive: boolean;
    }
  ]
}
```

**Response exitoso (200) - Plano (flat=true)**:
```typescript
{
  success: true,
  data: [
    {
      id: string;
      name: string;
      slug: string;
      description?: string;
      parentId?: string | null;
      image?: string;
      order: number;
      isActive: boolean;
    }
  ]
}
```

**Notas**:
- Por defecto, solo devolver categorías con `isActive = true`
- Ordenar por `order` ascendente
- Si `flat=false`, construir estructura jerárquica usando `parentId`
- Las categorías raíz tienen `parentId = null`

---

### 2. Obtener Categoría por ID

**GET** `/api/categories/:id`

**Autenticación**: No requerida

Obtiene una categoría específica por su ID, incluyendo sus hijos.

**Path Parameters**:
- `id`: UUID de la categoría

**Response exitoso (200)**:
```typescript
{
  success: true,
  data: {
    id: string;
    name: string;
    slug: string;
    description?: string;
    parentId?: string | null;
    children: [
      {
        id: string;
        name: string;
        slug: string;
        description?: string;
        parentId: string;
        image?: string;
        order: number;
        isActive: boolean;
      }
    ];
    image?: string;
    order: number;
    isActive: boolean;
  }
}
```

**Errores**:
- `404 Not Found`: Categoría no encontrada

---

## Endpoints: Carrito

**Nota importante**: Los endpoints de carrito son opcionales. El frontend actualmente maneja el carrito en localStorage. Implementar estos endpoints solo si se desea sincronización entre dispositivos.

### 1. Obtener Carrito

**GET** `/api/cart`

**Autenticación**: Requerida

Obtiene el carrito del usuario autenticado.

**Response exitoso (200)**:
```typescript
{
  success: true,
  data: {
    id: string;
    userId: string;
    items: [
      {
        id: string;
        product: {
          id: string;
          name: string;
          slug: string;
          price: number;
          discountPrice?: number;
          stock: number;
          images: [
            {
              id: string;
              url: string;
              alt: string;
              isPrimary: boolean;
              order: number;
            }
          ];
          isActive: boolean;
        };
        quantity: number;
        addedAt: string;
      }
    ];
    updatedAt: string;
  }
}
```

**Errores**:
- `401 Unauthorized`: Token inválido o expirado
- `404 Not Found`: Carrito no encontrado (crear uno vacío automáticamente)

---

### 2. Agregar Item al Carrito

**POST** `/api/cart/items`

**Autenticación**: Requerida

Agrega un producto al carrito o incrementa la cantidad si ya existe.

**Request Body**:
```typescript
{
  productId: string;
  quantity?: number;  // Default: 1
}
```

**Validaciones**:
- `productId`: requerido, debe existir en la BD
- `quantity`: opcional, debe ser > 0, default 1
- Verificar que el producto esté activo (`isActive = true`)
- Verificar que haya stock suficiente

**Response exitoso (201)**:
```typescript
{
  success: true,
  data: {
    id: string;
    product: {
      id: string;
      name: string;
      slug: string;
      price: number;
      discountPrice?: number;
      stock: number;
      images: [...];
      isActive: boolean;
    };
    quantity: number;
    addedAt: string;
  },
  message: "Producto agregado al carrito"
}
```

**Errores**:
- `401 Unauthorized`: Token inválido
- `404 Not Found`: Producto no encontrado
- `400 Bad Request`: Producto inactivo o sin stock suficiente
  ```typescript
  {
    success: false,
    error: {
      code: "INSUFFICIENT_STOCK",
      message: "Stock insuficiente",
      details: {
        available: number,
        requested: number
      }
    }
  }
  ```

---

### 3. Actualizar Cantidad de Item

**PUT** `/api/cart/items/:itemId`

**Autenticación**: Requerida

Actualiza la cantidad de un item en el carrito.

**Path Parameters**:
- `itemId`: UUID del item del carrito

**Request Body**:
```typescript
{
  quantity: number;  // Nueva cantidad (debe ser > 0)
}
```

**Validaciones**:
- `quantity`: requerido, debe ser > 0
- Verificar que haya stock suficiente

**Response exitoso (200)**:
```typescript
{
  success: true,
  data: {
    id: string;
    product: {...};
    quantity: number;
    addedAt: string;
  },
  message: "Cantidad actualizada"
}
```

**Errores**:
- `401 Unauthorized`: Token inválido
- `404 Not Found`: Item no encontrado en el carrito
- `400 Bad Request`: Stock insuficiente

---

### 4. Eliminar Item del Carrito

**DELETE** `/api/cart/items/:itemId`

**Autenticación**: Requerida

Elimina un item del carrito.

**Path Parameters**:
- `itemId`: UUID del item del carrito

**Response exitoso (200)**:
```typescript
{
  success: true,
  message: "Producto eliminado del carrito"
}
```

**Errores**:
- `401 Unauthorized`: Token inválido
- `404 Not Found`: Item no encontrado en el carrito

---

### 5. Vaciar Carrito

**DELETE** `/api/cart`

**Autenticación**: Requerida

Elimina todos los items del carrito del usuario.

**Response exitoso (200)**:
```typescript
{
  success: true,
  message: "Carrito vaciado"
}
```

**Errores**:
- `401 Unauthorized`: Token inválido

---

## Endpoints: Pedidos

### 1. Crear Pedido

**POST** `/api/orders`

**Autenticación**: Requerida

Crea un nuevo pedido desde el carrito o desde los items proporcionados.

**Request Body**:
```typescript
{
  items: [
    {
      productId: string;
      quantity: number;
    }
  ];
  shippingAddress: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    province: string;
    postalCode: string;
    notes?: string;
  };
  paymentMethod: 'credit_card' | 'debit_card' | 'cash_on_delivery' | 'bank_transfer';
  notes?: string;
}
```

**Validaciones**:
- `items`: requerido, al menos 1 item
- Cada item debe tener `productId` y `quantity` válidos
- Verificar que todos los productos existan, estén activos y tengan stock suficiente
- `shippingAddress`: todos los campos son requeridos excepto `notes`
- `paymentMethod`: requerido, debe ser uno de los valores válidos

**Lógica de negocio**:
1. Verificar stock de todos los productos
2. Calcular `subtotal`: sumar `(precio con descuento si existe, sino precio regular) * cantidad` de cada item
3. Calcular `shipping` usando la lógica de envío (ver endpoint `/api/shipping/calculate`)
4. Calcular `total`: `subtotal + shipping`
5. Generar `orderNumber` único con formato `ORD-YYYY-MMDD-HHMMSS-XXX`
6. Crear el pedido con estado `pending`
7. Crear los `OrderItem` asociados (capturar precio al momento de compra)
8. Descontar el stock de cada producto
9. Registrar cambios de stock en `StockHistory`
10. Vaciar el carrito del usuario (si se implementó carrito en backend)

**Response exitoso (201)**:
```typescript
{
  success: true,
  data: {
    id: string;
    orderNumber: string;
    userId: string;
    items: [
      {
        id: string;
        product: {
          id: string;
          name: string;
          slug: string;
          images: [...];
          categoryId: string;
          category: {...};
        };
        quantity: number;
        price: number;      // Precio al momento de compra
        subtotal: number;   // quantity * price
      }
    ];
    shippingAddress: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      address: string;
      city: string;
      province: string;
      postalCode: string;
      notes?: string;
    };
    paymentMethod: string;
    subtotal: number;
    shipping: number;
    total: number;
    status: 'pending';
    notes?: string;
    createdAt: string;
    updatedAt: string;
  },
  message: "Pedido creado exitosamente"
}
```

**Errores**:
- `401 Unauthorized`: Token inválido
- `400 Bad Request`: Datos inválidos o stock insuficiente
  ```typescript
  {
    success: false,
    error: {
      code: "INSUFFICIENT_STOCK",
      message: "Algunos productos no tienen stock suficiente",
      details: {
        products: [
          {
            productId: string;
            productName: string;
            requested: number;
            available: number;
          }
        ]
      }
    }
  }
  ```

---

### 2. Listar Pedidos del Usuario

**GET** `/api/orders`

**Autenticación**: Requerida

Lista todos los pedidos del usuario autenticado.

**Query Parameters**:
```typescript
{
  status?: string;      // Filtrar por estado
  page?: number;        // Número de página (default: 1)
  limit?: number;       // Items por página (default: 10, max: 50)
  sort?: 'newest' | 'oldest';  // Ordenamiento (default: 'newest')
}
```

**Response exitoso (200)**:
```typescript
{
  success: true,
  data: {
    orders: [
      {
        id: string;
        orderNumber: string;
        userId: string;
        items: [
          {
            id: string;
            product: {
              id: string;
              name: string;
              slug: string;
              images: [...];
            };
            quantity: number;
            price: number;
            subtotal: number;
          }
        ];
        shippingAddress: {...};
        paymentMethod: string;
        subtotal: number;
        shipping: number;
        total: number;
        status: string;
        notes?: string;
        createdAt: string;
        updatedAt: string;
      }
    ],
    pagination: {
      page: number;
      limit: number;
      totalItems: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    }
  }
}
```

**Errores**:
- `401 Unauthorized`: Token inválido

---

### 3. Obtener Pedido por ID

**GET** `/api/orders/:id`

**Autenticación**: Requerida

Obtiene un pedido específico del usuario autenticado.

**Path Parameters**:
- `id`: UUID del pedido

**Response exitoso (200)**:
```typescript
{
  success: true,
  data: {
    id: string;
    orderNumber: string;
    userId: string;
    items: [
      {
        id: string;
        product: {
          id: string;
          name: string;
          slug: string;
          description: string;
          images: [...];
          categoryId: string;
          category: {...};
        };
        quantity: number;
        price: number;
        subtotal: number;
      }
    ];
    shippingAddress: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      address: string;
      city: string;
      province: string;
      postalCode: string;
      notes?: string;
    };
    paymentMethod: string;
    subtotal: number;
    shipping: number;
    total: number;
    status: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
  }
}
```

**Errores**:
- `401 Unauthorized`: Token inválido
- `404 Not Found`: Pedido no encontrado
- `403 Forbidden`: El pedido no pertenece al usuario autenticado

---

### 4. Obtener Pedido por Número de Orden

**GET** `/api/orders/number/:orderNumber`

**Autenticación**: Requerida

Obtiene un pedido específico por su número de orden.

**Path Parameters**:
- `orderNumber`: Número de orden (ej: `ORD-2024-0115-143025-001`)

**Response exitoso (200)**: Igual que `GET /api/orders/:id`

**Errores**:
- `401 Unauthorized`: Token inválido
- `404 Not Found`: Pedido no encontrado
- `403 Forbidden`: El pedido no pertenece al usuario autenticado

---

## Endpoints: Envío

### 1. Calcular Costo de Envío

**POST** `/api/shipping/calculate`

**Autenticación**: No requerida

Calcula el costo de envío basado en el subtotal y opcionalmente en la ubicación.

**Request Body**:
```typescript
{
  subtotal: number;       // Subtotal del pedido
  postalCode?: string;    // Código postal (opcional, para futuro)
  address?: string;       // Dirección (opcional, para futuro)
  city?: string;          // Ciudad (opcional, para futuro)
  province?: string;      // Provincia (opcional, para futuro)
}
```

**Validaciones**:
- `subtotal`: requerido, debe ser >= 0

**Lógica de negocio**:
- Si `subtotal >= FREE_SHIPPING_THRESHOLD` → envío gratis (shipping = 0)
- Si no, `shipping = SHIPPING_COST` (por ahora valor fijo)
- En el futuro, usar `postalCode` para calcular por zona

**Valores configurables (variables de entorno)**:
- `FREE_SHIPPING_THRESHOLD`: default 10000
- `SHIPPING_COST`: default 1500

**Response exitoso (200)**:
```typescript
{
  success: true,
  data: {
    shipping: number;                    // Costo de envío calculado
    freeShippingThreshold: number;       // Umbral para envío gratis
    isFreeShipping: boolean;             // Si aplica envío gratis
    amountNeededForFreeShipping: number; // Cuánto falta para envío gratis (0 si ya aplica)
  }
}
```

**Errores**:
- `400 Bad Request`: Datos inválidos

---

## Endpoints: Admin - Productos

Todos los endpoints bajo `/api/admin/*` requieren autenticación y role `admin`.

### 1. Listar Productos (Admin)

**GET** `/api/admin/products`

**Autenticación**: Requerida (Admin)

Lista todos los productos, incluyendo inactivos, con filtros y búsqueda.

**Query Parameters**:
```typescript
{
  search?: string;
  category?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  lowStock?: boolean;     // Productos con stock < threshold
  outOfStock?: boolean;   // Productos con stock = 0
  sort?: string;
  page?: number;
  limit?: number;
}
```

**Response exitoso (200)**: Similar a `GET /api/products` pero incluyendo productos inactivos

**Errores**:
- `401 Unauthorized`: Token inválido
- `403 Forbidden`: Usuario no es admin

---

### 2. Obtener Producto por ID (Admin)

**GET** `/api/admin/products/:id`

**Autenticación**: Requerida (Admin)

Obtiene un producto por ID, incluyendo información adicional para administración.

**Response exitoso (200)**: Igual que `GET /api/products/:id`

**Errores**:
- `401 Unauthorized`: Token inválido
- `403 Forbidden`: Usuario no es admin
- `404 Not Found`: Producto no encontrado

---

### 3. Crear Producto

**POST** `/api/admin/products`

**Autenticación**: Requerida (Admin)

Crea un nuevo producto.

**Request Body**:
```typescript
{
  name: string;
  description: string;
  shortDescription?: string;
  sku: string;
  price: number;
  discountPercentage?: number;  // Si se proporciona, calcular discountPrice
  stock: number;
  categoryId: string;
  images: [
    {
      url: string;
      alt: string;
      isPrimary?: boolean;
      order?: number;
    }
  ];
  variants?: [
    {
      name: string;
      options: [
        {
          value: string;
          priceModifier?: number;
          stock: number;
          sku?: string;
        }
      ];
    }
  ];
  specifications?: {
    [key: string]: string;
  };
  isActive?: boolean;        // Default: true
  isFeatured?: boolean;      // Default: false
  tags?: string[];
  weight?: number;
  dimensions?: {
    width: number;
    height: number;
    depth: number;
  };
}
```

**Validaciones**:
- `name`: requerido, máximo 200 caracteres
- `description`: requerido
- `sku`: requerido, único
- `price`: requerido, debe ser > 0
- `discountPercentage`: si se proporciona, debe estar entre 0 y 100
- `stock`: requerido, debe ser >= 0
- `categoryId`: requerido, debe existir
- `images`: al menos 1 imagen requerida

**Lógica de negocio**:
- Generar `slug` automáticamente desde `name` (lowercase, sin espacios, con guiones)
- Si `slug` ya existe, agregar sufijo numérico
- Si `discountPercentage` se proporciona, calcular `discountPrice = price * (1 - discountPercentage / 100)`
- Si no se especifica `order` en imágenes, asignar automáticamente
- Solo una imagen puede tener `isPrimary = true`

**Response exitoso (201)**:
```typescript
{
  success: true,
  data: {
    // Producto completo creado
    id: string;
    name: string;
    slug: string;
    // ... todos los campos
  },
  message: "Producto creado exitosamente"
}
```

**Errores**:
- `401 Unauthorized`: Token inválido
- `403 Forbidden`: Usuario no es admin
- `400 Bad Request`: Datos inválidos
- `409 Conflict`: SKU duplicado

---

### 4. Actualizar Producto

**PUT** `/api/admin/products/:id`

**Autenticación**: Requerida (Admin)

Actualiza un producto existente.

**Path Parameters**:
- `id`: UUID del producto

**Request Body**: Todos los campos son opcionales (actualización parcial)
```typescript
{
  name?: string;
  description?: string;
  shortDescription?: string;
  sku?: string;
  price?: number;
  discountPercentage?: number;
  stock?: number;
  categoryId?: string;
  images?: [
    {
      id?: string;        // Si tiene id, actualiza; si no, crea
      url: string;
      alt: string;
      isPrimary?: boolean;
      order?: number;
    }
  ];
  variants?: [...];       // Igual que en crear
  specifications?: {...};
  isActive?: boolean;
  isFeatured?: boolean;
  tags?: string[];
  weight?: number;
  dimensions?: {...};
}
```

**Validaciones**: Igual que en crear, pero todos opcionales

**Lógica de negocio**:
- Si se actualiza `name`, regenerar `slug`
- Si se actualiza `discountPercentage` o `price`, recalcular `discountPrice`
- Si se actualiza `stock`, registrar cambio en `StockHistory`

**Response exitoso (200)**:
```typescript
{
  success: true,
  data: {
    // Producto actualizado completo
  },
  message: "Producto actualizado exitosamente"
}
```

**Errores**:
- `401 Unauthorized`: Token inválido
- `403 Forbidden`: Usuario no es admin
- `404 Not Found`: Producto no encontrado
- `400 Bad Request`: Datos inválidos
- `409 Conflict`: SKU duplicado

---

### 5. Eliminar Producto

**DELETE** `/api/admin/products/:id`

**Autenticación**: Requerida (Admin)

Elimina un producto. Soft delete recomendado (marcar como inactivo).

**Path Parameters**:
- `id`: UUID del producto

**Lógica de negocio**:
- **Opción 1 (recomendada)**: Soft delete - marcar `isActive = false`
- **Opción 2**: Hard delete - eliminar de la BD
  - Verificar que no existan pedidos con este producto
  - Si existen, no permitir eliminar (retornar error)

**Response exitoso (200)**:
```typescript
{
  success: true,
  message: "Producto eliminado exitosamente"
}
```

**Errores**:
- `401 Unauthorized`: Token inválido
- `403 Forbidden`: Usuario no es admin
- `404 Not Found`: Producto no encontrado
- `409 Conflict`: Producto tiene pedidos asociados (si se intenta hard delete)

---

### 6. Actualizar Stock de Producto

**PUT** `/api/admin/products/:id/stock`

**Autenticación**: Requerida (Admin)

Actualiza solo el stock de un producto y registra en historial.

**Path Parameters**:
- `id`: UUID del producto

**Request Body**:
```typescript
{
  stock: number;     // Nuevo valor de stock
  reason?: string;   // Razón del cambio (opcional)
}
```

**Validaciones**:
- `stock`: requerido, debe ser >= 0

**Lógica de negocio**:
1. Obtener stock actual
2. Actualizar stock
3. Registrar cambio en `StockHistory` con `previousStock`, `newStock` y `reason`

**Response exitoso (200)**:
```typescript
{
  success: true,
  data: {
    id: string;
    name: string;
    previousStock: number;
    newStock: number;
    updatedAt: string;
  },
  message: "Stock actualizado exitosamente"
}
```

**Errores**:
- `401 Unauthorized`: Token inválido
- `403 Forbidden`: Usuario no es admin
- `404 Not Found`: Producto no encontrado
- `400 Bad Request`: Stock inválido

---

## Endpoints: Admin - Categorías

### 1. Listar Categorías (Admin)

**GET** `/api/admin/categories`

**Autenticación**: Requerida (Admin)

Lista todas las categorías, incluyendo inactivas.

**Query Parameters**:
```typescript
{
  includeInactive?: boolean;  // Default: true (admin ve todo)
  flat?: boolean;             // Default: false
}
```

**Response exitoso (200)**: Similar a `GET /api/categories` pero incluyendo inactivas

**Errores**:
- `401 Unauthorized`: Token inválido
- `403 Forbidden`: Usuario no es admin

---

### 2. Crear Categoría

**POST** `/api/admin/categories`

**Autenticación**: Requerida (Admin)

Crea una nueva categoría.

**Request Body**:
```typescript
{
  name: string;
  description?: string;
  parentId?: string | null;   // ID de categoría padre (null para raíz)
  image?: string;
  order?: number;             // Default: 0
  isActive?: boolean;         // Default: true
}
```

**Validaciones**:
- `name`: requerido, máximo 100 caracteres
- `parentId`: si se proporciona, debe existir

**Lógica de negocio**:
- Generar `slug` automáticamente desde `name`
- Si `slug` ya existe, agregar sufijo numérico

**Response exitoso (201)**:
```typescript
{
  success: true,
  data: {
    id: string;
    name: string;
    slug: string;
    description?: string;
    parentId?: string | null;
    image?: string;
    order: number;
    isActive: boolean;
  },
  message: "Categoría creada exitosamente"
}
```

**Errores**:
- `401 Unauthorized`: Token inválido
- `403 Forbidden`: Usuario no es admin
- `400 Bad Request`: Datos inválidos
- `404 Not Found`: parentId no existe

---

### 3. Actualizar Categoría

**PUT** `/api/admin/categories/:id`

**Autenticación**: Requerida (Admin)

Actualiza una categoría existente.

**Path Parameters**:
- `id`: UUID de la categoría

**Request Body**: Todos los campos opcionales
```typescript
{
  name?: string;
  description?: string;
  parentId?: string | null;
  image?: string;
  order?: number;
  isActive?: boolean;
}
```

**Validaciones**: Igual que en crear, pero todos opcionales

**Lógica de negocio**:
- Si se actualiza `name`, regenerar `slug`
- Si se actualiza `parentId`, verificar que no cree ciclo (categoría no puede ser padre de sí misma)

**Response exitoso (200)**:
```typescript
{
  success: true,
  data: {
    // Categoría actualizada
  },
  message: "Categoría actualizada exitosamente"
}
```

**Errores**:
- `401 Unauthorized`: Token inválido
- `403 Forbidden`: Usuario no es admin
- `404 Not Found`: Categoría no encontrada
- `400 Bad Request`: Datos inválidos o ciclo detectado

---

### 4. Eliminar Categoría

**DELETE** `/api/admin/categories/:id`

**Autenticación**: Requerida (Admin)

Elimina una categoría.

**Path Parameters**:
- `id`: UUID de la categoría

**Lógica de negocio**:
- Verificar que no existan productos con esta categoría
- Verificar que no existan categorías hijas
- Si existen productos o hijos, no permitir eliminar (retornar error)

**Response exitoso (200)**:
```typescript
{
  success: true,
  message: "Categoría eliminada exitosamente"
}
```

**Errores**:
- `401 Unauthorized`: Token inválido
- `403 Forbidden`: Usuario no es admin
- `404 Not Found`: Categoría no encontrada
- `409 Conflict`: Categoría tiene productos o hijos asociados
  ```typescript
  {
    success: false,
    error: {
      code: "CATEGORY_HAS_DEPENDENCIES",
      message: "No se puede eliminar la categoría porque tiene productos o categorías hijas asociadas",
      details: {
        productsCount: number;
        childrenCount: number;
      }
    }
  }
  ```

---

## Endpoints: Admin - Pedidos

### 1. Listar Todos los Pedidos (Admin)

**GET** `/api/admin/orders`

**Autenticación**: Requerida (Admin)

Lista todos los pedidos de todos los usuarios.

**Query Parameters**:
```typescript
{
  status?: string;           // Filtrar por estado
  userId?: string;           // Filtrar por usuario
  search?: string;           // Buscar por orderNumber, email, nombre
  dateFrom?: string;         // Fecha desde (ISO 8601)
  dateTo?: string;           // Fecha hasta (ISO 8601)
  minTotal?: number;         // Total mínimo
  maxTotal?: number;         // Total máximo
  paymentMethod?: string;    // Filtrar por método de pago
  page?: number;
  limit?: number;
  sort?: 'newest' | 'oldest' | 'total-asc' | 'total-desc';
}
```

**Response exitoso (200)**:
```typescript
{
  success: true,
  data: {
    orders: [
      {
        id: string;
        orderNumber: string;
        userId: string;
        user: {  // Información del usuario incluida
          id: string;
          email: string;
          firstName: string;
          lastName: string;
        };
        items: [...];
        shippingAddress: {...};
        paymentMethod: string;
        subtotal: number;
        shipping: number;
        total: number;
        status: string;
        notes?: string;
        createdAt: string;
        updatedAt: string;
      }
    ],
    pagination: {...};
    summary: {  // Resumen estadístico
      totalOrders: number;
      totalRevenue: number;
      averageOrderValue: number;
      ordersByStatus: {
        pending: number;
        confirmed: number;
        processing: number;
        shipped: number;
        delivered: number;
        cancelled: number;
      };
    }
  }
}
```

**Errores**:
- `401 Unauthorized`: Token inválido
- `403 Forbidden`: Usuario no es admin

---

### 2. Actualizar Estado de Pedido

**PUT** `/api/admin/orders/:id/status`

**Autenticación**: Requerida (Admin)

Actualiza el estado de un pedido.

**Path Parameters**:
- `id`: UUID del pedido

**Request Body**:
```typescript
{
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  notes?: string;  // Notas adicionales sobre el cambio de estado
}
```

**Validaciones**:
- `status`: requerido, debe ser un valor válido
- Verificar flujo de estados válido:
  - No se puede pasar de `shipped` o `delivered` a `cancelled`
  - No se puede pasar de `delivered` a estados anteriores

**Lógica de negocio**:
- Si se cambia a `cancelled`, considerar devolver stock a los productos
- Actualizar `updatedAt` del pedido

**Response exitoso (200)**:
```typescript
{
  success: true,
  data: {
    id: string;
    orderNumber: string;
    status: string;
    updatedAt: string;
  },
  message: "Estado actualizado exitosamente"
}
```

**Errores**:
- `401 Unauthorized`: Token inválido
- `403 Forbidden`: Usuario no es admin
- `404 Not Found`: Pedido no encontrado
- `400 Bad Request`: Transición de estado inválida
  ```typescript
  {
    success: false,
    error: {
      code: "INVALID_STATUS_TRANSITION",
      message: "No se puede cambiar el estado del pedido",
      details: {
        currentStatus: string;
        requestedStatus: string;
      }
    }
  }
  ```

---

## Endpoints: Admin - Stock

### 1. Obtener Historial de Stock

**GET** `/api/admin/stock/history`

**Autenticación**: Requerida (Admin)

Obtiene el historial de cambios de stock de todos los productos.

**Query Parameters**:
```typescript
{
  productId?: string;    // Filtrar por producto
  dateFrom?: string;     // Fecha desde (ISO 8601)
  dateTo?: string;       // Fecha hasta (ISO 8601)
  page?: number;
  limit?: number;
  sort?: 'newest' | 'oldest';
}
```

**Response exitoso (200)**:
```typescript
{
  success: true,
  data: {
    history: [
      {
        id: string;
        productId: string;
        productName: string;
        previousStock: number;
        newStock: number;
        reason?: string;
        createdAt: string;
      }
    ],
    pagination: {...}
  }
}
```

**Errores**:
- `401 Unauthorized`: Token inválido
- `403 Forbidden`: Usuario no es admin

---

### 2. Obtener Historial de Stock por Producto

**GET** `/api/admin/stock/history/:productId`

**Autenticación**: Requerida (Admin)

Obtiene el historial de cambios de stock de un producto específico.

**Path Parameters**:
- `productId`: UUID del producto

**Query Parameters**:
```typescript
{
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
  sort?: 'newest' | 'oldest';
}
```

**Response exitoso (200)**: Similar a `GET /api/admin/stock/history`

**Errores**:
- `401 Unauthorized`: Token inválido
- `403 Forbidden`: Usuario no es admin
- `404 Not Found`: Producto no encontrado

---

### 3. Configurar Umbral de Stock Bajo

**PUT** `/api/admin/stock/threshold`

**Autenticación**: Requerida (Admin)

Configura el umbral global de stock bajo para alertas.

**Request Body**:
```typescript
{
  threshold: number;  // Umbral de stock bajo
}
```

**Validaciones**:
- `threshold`: requerido, debe ser >= 0

**Nota**: Este valor puede almacenarse en una tabla de configuración o como variable de entorno.

**Response exitoso (200)**:
```typescript
{
  success: true,
  data: {
    threshold: number;
  },
  message: "Umbral de stock actualizado"
}
```

**Errores**:
- `401 Unauthorized`: Token inválido
- `403 Forbidden`: Usuario no es admin
- `400 Bad Request`: Threshold inválido

---

## Reglas de Negocio

### Productos

1. **Slug único**: El slug se genera automáticamente desde el nombre. Si ya existe, agregar sufijo numérico.
2. **SKU único**: Cada producto debe tener un SKU único.
3. **Precio con descuento**: Si `discountPercentage` está presente, calcular `discountPrice = price * (1 - discountPercentage / 100)`.
4. **Stock no negativo**: El stock nunca puede ser negativo.
5. **Imagen principal**: Solo una imagen puede tener `isPrimary = true` por producto.
6. **Productos activos**: Solo productos con `isActive = true` son visibles al público.

### Categorías

1. **Slug único**: Similar a productos.
2. **Jerarquía válida**: No permitir ciclos en la jerarquía (una categoría no puede ser padre de sí misma, ni directa ni indirectamente).
3. **Eliminar categorías**: No permitir eliminar si tiene productos o categorías hijas asociadas.

### Carrito

1. **Validación de stock**: Antes de agregar o actualizar cantidad, verificar que haya stock suficiente.
2. **Productos activos**: Solo permitir agregar productos con `isActive = true`.
3. **Cantidad mínima**: La cantidad debe ser mayor a 0.

### Pedidos

1. **Número de orden único**: Formato `ORD-YYYY-MMDD-HHMMSS-XXX` (XXX es un contador incremental).
2. **Captura de precio**: El precio en `OrderItem` debe ser el precio del producto al momento de la compra (usar `discountPrice` si existe, sino `price`).
3. **Descuento de stock**: Al crear un pedido, descontar el stock de los productos.
4. **Flujo de estados**: Los estados deben seguir un flujo lógico:
   - `pending` → `confirmed` → `processing` → `shipped` → `delivered`
   - `cancelled` puede aplicarse en cualquier momento antes de `shipped`
5. **Historial de stock**: Registrar cada cambio de stock en la tabla `StockHistory`.
6. **Validación de stock**: Verificar que haya stock suficiente antes de crear el pedido.

### Envío

1. **Envío gratis**: Si `subtotal >= FREE_SHIPPING_THRESHOLD`, el envío es gratis.
2. **Costo base**: Si no aplica envío gratis, usar `SHIPPING_COST`.
3. **Cálculo por zona** (futuro): Usar `postalCode` para calcular costo adicional por zona.

### Autenticación

1. **Password hash**: Siempre hashear passwords con bcrypt (mínimo 10 rounds).
2. **JWT expiration**: Tokens válidos por 7 días (configurable).
3. **Role por defecto**: Usuarios registrados tienen role `customer` por defecto.
4. **Admin único**: Crear un usuario admin por defecto en el seed de la BD.

---

## Códigos de Estado HTTP

### Códigos de éxito

- `200 OK`: Solicitud exitosa (GET, PUT, DELETE)
- `201 Created`: Recurso creado exitosamente (POST)
- `204 No Content`: Solicitud exitosa sin contenido en respuesta (DELETE, opcional)

### Códigos de error del cliente

- `400 Bad Request`: Datos de entrada inválidos o validación fallida
- `401 Unauthorized`: No autenticado o token inválido
- `403 Forbidden`: Autenticado pero sin permisos suficientes
- `404 Not Found`: Recurso no encontrado
- `409 Conflict`: Conflicto con el estado actual (ej: email duplicado, SKU duplicado)
- `422 Unprocessable Entity`: Entidad no procesable (validación semántica fallida)

### Códigos de error del servidor

- `500 Internal Server Error`: Error inesperado del servidor
- `503 Service Unavailable`: Servicio temporalmente no disponible

---

## Variables de Entorno

### Backend

```env
# Base de datos
DATABASE_URL=postgresql://user:password@localhost:5432/snacks_db

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d

# Cookies
COOKIE_SECRET=your-cookie-secret-here

# Envío
FREE_SHIPPING_THRESHOLD=10000
SHIPPING_COST=1500

# CORS
CORS_ORIGIN=http://localhost:3000

# Puerto
PORT=4000

# Ambiente
NODE_ENV=development

# Storage (si se usa Cloudinary o S3)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# O para S3
AWS_S3_BUCKET=your-bucket-name
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
```

### Frontend (ya existentes, para referencia)

```env
# API URL
NEXT_PUBLIC_API_URL=http://localhost:4000/api

# Envío (valores por defecto)
NEXT_PUBLIC_FREE_SHIPPING_THRESHOLD=10000
NEXT_PUBLIC_SHIPPING_COST=1500
```

---

## Notas de Implementación

### Seguridad

1. **Passwords**: Siempre hashear con bcrypt (mínimo 10 rounds).
2. **JWT**: Usar cookies HttpOnly para almacenar tokens (previene XSS).
3. **CORS**: Configurar CORS correctamente para permitir solo el dominio del frontend.
4. **Rate limiting**: Implementar rate limiting en endpoints sensibles (login, registro).
5. **Validación de entrada**: Validar todos los inputs con class-validator o Joi.
6. **SQL Injection**: Usar Prisma ORM previene SQL injection por defecto.
7. **Sanitización**: Sanitizar inputs antes de almacenar en BD.

### Performance

1. **Índices**: Crear índices en campos usados frecuentemente en queries (ver definición de tablas).
2. **Paginación**: Siempre paginar resultados de listados.
3. **Eager loading**: Usar eager loading para relaciones necesarias (evitar N+1).
4. **Caché**: Considerar implementar caché con Redis para:
   - Listado de productos
   - Categorías
   - Información de productos
5. **Imágenes**: Usar CDN para servir imágenes (Cloudinary, S3 + CloudFront).

### Testing

1. **Unit tests**: Para servicios y utilidades.
2. **Integration tests**: Para endpoints de API.
3. **E2E tests**: Para flujos críticos (registro, login, crear pedido).

### Logging

1. **Request logging**: Loggear todas las requests (método, ruta, status, tiempo).
2. **Error logging**: Loggear todos los errores con stack trace.
3. **Audit logging**: Loggear cambios importantes (actualizaciones de stock, cambios de estado de pedidos).

### Deployment

1. **Migraciones**: Usar Prisma migrations para cambios de esquema.
2. **Seeds**: Crear seeds para:
   - Usuario admin por defecto
   - Categorías iniciales
   - Productos de ejemplo (opcional)
3. **Health check**: Endpoint `/health` para monitoreo.
4. **CI/CD**: Configurar pipeline de deployment automático.

### Monitoreo

1. **Uptime monitoring**: Monitorear disponibilidad del servicio.
2. **Performance monitoring**: Monitorear tiempos de respuesta.
3. **Error tracking**: Usar servicio como Sentry para tracking de errores.
4. **Database monitoring**: Monitorear uso de BD (conexiones, queries lentas).

---

## Anexo: Esquema Prisma Sugerido

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  customer
  admin
}

enum PaymentMethod {
  credit_card
  debit_card
  cash_on_delivery
  bank_transfer
}

enum OrderStatus {
  pending
  confirmed
  processing
  shipped
  delivered
  cancelled
}

model User {
  id              String   @id @default(uuid())
  email           String   @unique
  password        String
  firstName       String
  lastName        String
  phone           String?
  role            UserRole @default(customer)
  shippingAddress Json?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  orders Order[]
  cart   Cart?

  @@index([email])
  @@index([role])
}

model Category {
  id          String      @id @default(uuid())
  name        String
  slug        String      @unique
  description String?
  parentId    String?
  parent      Category?   @relation("CategoryChildren", fields: [parentId], references: [id])
  children    Category[]  @relation("CategoryChildren")
  image       String?
  order       Int         @default(0)
  isActive    Boolean     @default(true)
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  products Product[]

  @@index([slug])
  @@index([parentId])
  @@index([isActive])
}

model Product {
  id                 String           @id @default(uuid())
  name               String
  slug               String           @unique
  description        String
  shortDescription   String?
  sku                String           @unique
  price              Decimal          @db.Decimal(10, 2)
  discountPrice      Decimal?         @db.Decimal(10, 2)
  discountPercentage Int?
  stock              Int              @default(0)
  categoryId         String
  category           Category         @relation(fields: [categoryId], references: [id])
  specifications     Json?
  isActive           Boolean          @default(true)
  isFeatured         Boolean          @default(false)
  tags               String[]
  weight             Decimal?         @db.Decimal(10, 2)
  dimensions         Json?
  createdAt          DateTime         @default(now())
  updatedAt          DateTime         @updatedAt

  images        ProductImage[]
  variants      ProductVariant[]
  cartItems     CartItem[]
  orderItems    OrderItem[]
  stockHistory  StockHistory[]

  @@index([slug])
  @@index([sku])
  @@index([categoryId])
  @@index([isActive])
  @@index([isFeatured])
}

model ProductImage {
  id        String   @id @default(uuid())
  productId String
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  url       String
  alt       String
  isPrimary Boolean  @default(false)
  order     Int      @default(0)
  createdAt DateTime @default(now())

  @@index([productId])
  @@index([productId, isPrimary])
}

model ProductVariant {
  id        String          @id @default(uuid())
  productId String
  product   Product         @relation(fields: [productId], references: [id], onDelete: Cascade)
  name      String
  createdAt DateTime        @default(now())

  options VariantOption[]

  @@index([productId])
}

model VariantOption {
  id            String         @id @default(uuid())
  variantId     String
  variant       ProductVariant @relation(fields: [variantId], references: [id], onDelete: Cascade)
  value         String
  priceModifier Decimal?       @db.Decimal(10, 2)
  stock         Int            @default(0)
  sku           String?        @unique
  createdAt     DateTime       @default(now())

  @@index([variantId])
  @@index([sku])
}

model Cart {
  id        String     @id @default(uuid())
  userId    String     @unique
  user      User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt

  items CartItem[]

  @@index([userId])
}

model CartItem {
  id        String   @id @default(uuid())
  cartId    String
  cart      Cart     @relation(fields: [cartId], references: [id], onDelete: Cascade)
  productId String
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  quantity  Int      @default(1)
  addedAt   DateTime @default(now())

  @@unique([cartId, productId])
  @@index([cartId])
  @@index([productId])
}

model Order {
  id              String        @id @default(uuid())
  orderNumber     String        @unique
  userId          String
  user            User          @relation(fields: [userId], references: [id])
  shippingAddress Json
  paymentMethod   PaymentMethod
  subtotal        Decimal       @db.Decimal(10, 2)
  shipping        Decimal       @db.Decimal(10, 2)
  total           Decimal       @db.Decimal(10, 2)
  status          OrderStatus   @default(pending)
  notes           String?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  items OrderItem[]

  @@index([orderNumber])
  @@index([userId])
  @@index([status])
  @@index([createdAt])
}

model OrderItem {
  id        String   @id @default(uuid())
  orderId   String
  order     Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  productId String
  product   Product  @relation(fields: [productId], references: [id])
  quantity  Int
  price     Decimal  @db.Decimal(10, 2)
  subtotal  Decimal  @db.Decimal(10, 2)
  createdAt DateTime @default(now())

  @@index([orderId])
  @@index([productId])
}

model StockHistory {
  id            String   @id @default(uuid())
  productId     String
  product       Product  @relation(fields: [productId], references: [id])
  productName   String
  previousStock Int
  newStock      Int
  reason        String?
  createdAt     DateTime @default(now())

  @@index([productId])
  @@index([createdAt])
}
```

---

## Fin del Documento

**Versión**: 1.0  
**Fecha**: 2024-02-04  
**Mantenido por**: Equipo de desarrollo

Para dudas o aclaraciones sobre esta especificación, referirse al código del frontend en el repositorio o contactar al equipo de frontend.
