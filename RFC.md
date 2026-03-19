# RFC — Admin Orders, Stock History & Producción

**RFC-001**
**Fecha**: 2026-03-18
**Estado**: Propuesto
**Autor**: Equipo de desarrollo
**Afecta a**: Fase 7 (Admin Pedidos y Stock), Fase 8 (Documentación), Fase 9 (Despliegue)

---

## Resumen

Este RFC propone el diseño técnico detallado para completar el backend del e-commerce de snacks. Las Fases 0–6 están implementadas; este documento cubre las decisiones de diseño, contratos de interfaces, arquitectura de eventos y plan de implementación para las **Fases 7, 8 y 9** pendientes.

El trabajo pendiente se divide en tres áreas:
1. **Fase 7**: Panel admin de pedidos y historial de stock (feature incompleto)
2. **Fase 8**: Decoradores Swagger, health checks y verificación de pipeline global
3. **Fase 9**: Despliegue a producción (Railway)

---

## Tabla de Contenidos

1. [Contexto y Motivación](#1-contexto-y-motivación)
2. [Estado Actual del Código](#2-estado-actual-del-código)
3. [Diseño Técnico — Fase 7](#3-diseño-técnico--fase-7)
   - [3.1 Estructura de módulos](#31-estructura-de-módulos-a-crear)
   - [3.2 AdminOrdersModule](#32-adminordersmodule)
   - [3.3 AdminStockModule](#33-adminstockmodule)
   - [3.4 Máquina de estados](#34-máquina-de-estados-de-pedidos)
   - [3.5 Transacción de cancelación](#35-transacción-de-cancelación)
   - [3.6 Arquitectura de eventos](#36-arquitectura-de-eventos)
   - [3.7 DTOs](#37-dtos)
   - [3.8 Interfaces de dominio](#38-interfaces-de-dominio)
   - [3.9 Errores](#39-errores)
4. [Diseño Técnico — Fase 8](#4-diseño-técnico--fase-8)
5. [Diseño Técnico — Fase 9](#5-diseño-técnico--fase-9)
6. [Decisiones de Diseño y Trade-offs](#6-decisiones-de-diseño-y-trade-offs)
7. [Checklist de Implementación](#7-checklist-de-implementación)

---

## 1. Contexto y Motivación

### ¿Por qué este RFC?

El backend tiene implementadas las Fases 0–6, incluyendo autenticación, catálogo público, carrito, pedidos del usuario y el panel admin de productos y categorías. Sin embargo, la funcionalidad más crítica para operaciones —la gestión de pedidos por parte del admin— está completamente vacía (`admin-orders/.gitkeep`, `admin-stock/.gitkeep`).

Sin esta fase:
- El admin no puede actualizar el estado de ningún pedido
- No hay visibilidad del historial de stock
- No hay resumen estadístico de ventas
- El frontend del panel admin no puede hacer operaciones sobre pedidos

### Qué NO cubre este RFC

- Tests unitarios o de integración (excluidos según la planificación)
- Autenticación con proveedores OAuth
- Sistema de notificaciones por email
- Caché con Redis
- Upload de imágenes en el backend (las imágenes son URLs externas)

---

## 2. Estado Actual del Código

### Módulos completados (Fases 0–6)

```
src/modules/
├── auth/              ✅ — JWT, login, register, logout, me, profile, password
├── users/             ✅ — UsersRepository, UsersService
├── products/          ✅ — Listado público con filtros, paginación, soft auth
├── categories/        ✅ — Jerarquía y plano, soft auth
├── cart/              ✅ — CRUD completo, validaciones de stock
├── orders/            ✅ — Crear pedido transaccional, listar, detalle
├── shipping/          ✅ — Cálculo de envío por umbral
└── admin/
    ├── admin-products/ ✅ — CRUD completo, soft delete, stock update
    ├── admin-categories/ ✅ — CRUD, jerarquía, prevención de ciclos
    ├── admin-orders/   ❌ — Solo .gitkeep
    ├── admin-stock/    ❌ — Solo .gitkeep
    └── shared/         ✅ — SlugService
```

### Infraestructura existente reutilizable

| Componente | Ruta | Uso en Fase 7 |
|-----------|------|---------------|
| `BaseRepository` | `src/database/repositories/base.repository.ts` | Extender para `AdminOrdersRepository` y `StockHistoryRepository` |
| `OrdersRepository` | `src/modules/orders/orders.repository.ts` | Extender/importar para queries de admin |
| `EVENT_NAMES` | `src/common/events/event-types.ts` | Usar `order.cancelled`, `stock.updated` |
| `ERROR_CODES` | `src/common/constants/error-codes.ts` | `INVALID_STATUS_TRANSITION`, `ORDER_NOT_FOUND` ya definidos |
| `OrderCreatedEvent` | `src/modules/orders/events/order-created.event.ts` | Patrón a replicar para `OrderStatusChangedEvent` |
| `CartListener` | `src/modules/orders/listeners/cart.listener.ts` | Patrón a replicar para `StockReturnListener` |
| `StockManagementService` | `src/modules/orders/services/stock-management.service.ts` | **Reutilizar directamente** para devolver stock |
| `calculatePaginationMeta` | `src/common/utils/pagination.util.ts` | Paginación en listados |
| `RolesGuard` + `@Roles(admin)` | `src/auth/guards/` | Proteger todos los endpoints admin |

### Eventos ya definidos pero sin listener

```typescript
// src/common/events/event-types.ts — eventos disponibles, sin listener aún:
EVENT_NAMES.order.updated    // 'order.updated'
EVENT_NAMES.order.cancelled  // 'order.cancelled'
EVENT_NAMES.stock.updated    // 'stock.updated'
EVENT_NAMES.stock.low        // 'stock.low'
```

---

## 3. Diseño Técnico — Fase 7

### 3.1 Estructura de módulos a crear

```
src/modules/admin/
├── admin-orders/
│   ├── admin-orders.module.ts
│   ├── admin-orders.controller.ts
│   ├── admin-orders.service.ts
│   ├── admin-orders.repository.ts
│   ├── dto/
│   │   ├── admin-order-query.dto.ts
│   │   └── update-order-status.dto.ts
│   ├── interfaces/
│   │   ├── admin-order-filters.interface.ts
│   │   ├── admin-order-detail.interface.ts
│   │   └── order-summary.interface.ts
│   ├── events/
│   │   └── order-status-changed.event.ts
│   ├── listeners/
│   │   └── stock-return.listener.ts
│   └── services/
│       ├── order-status-validation.service.ts
│       └── order-summary.service.ts
└── admin-stock/
    ├── admin-stock.module.ts
    ├── admin-stock.controller.ts
    ├── admin-stock.service.ts
    ├── admin-stock.repository.ts
    ├── dto/
    │   ├── stock-history-query.dto.ts
    │   └── update-stock-threshold.dto.ts
    └── interfaces/
        ├── stock-history-filters.interface.ts
        └── stock-history-item.interface.ts
```

---

### 3.2 AdminOrdersModule

#### Repositorio — `admin-orders.repository.ts`

Extiende `BaseRepository`. No extiende `OrdersRepository` (evitar acoplamiento vertical; compartir lógica mediante el servicio o PrismaService directamente cuando sea conveniente).

```typescript
// Contrato del repositorio
interface AdminOrdersRepositoryContract {
  findAllWithFilters(
    filters: AdminOrderFilters,
    pagination: { page: number; limit: number },
  ): Promise<{ orders: AdminOrderDetail[]; total: number }>;

  findByIdForAdmin(id: string): Promise<AdminOrderDetail | null>;
  findByOrderNumberForAdmin(orderNumber: string): Promise<AdminOrderDetail | null>;

  updateStatus(
    id: string,
    status: OrderStatus,
    notes?: string,
  ): Promise<{ id: string; orderNumber: string; status: OrderStatus; updatedAt: Date }>;

  calculateSummary(filters: AdminOrderFilters): Promise<OrderSummary>;
}
```

**Decisión de diseño:** El resumen estadístico (`calculateSummary`) se calcula como una query separada con `groupBy` en Prisma, no iterando los resultados del listado, para no estar limitado por la paginación.

```typescript
// Implementación del calculateSummary con Prisma
async calculateSummary(filters: AdminOrderFilters): Promise<OrderSummary> {
  const where = this.buildWhereClause(filters);

  const [aggregate, grouped] = await Promise.all([
    this.prisma.order.aggregate({
      where,
      _sum: { total: true },
      _avg: { total: true },
      _count: { id: true },
    }),
    this.prisma.order.groupBy({
      by: ['status'],
      where,
      _count: { id: true },
    }),
  ]);

  return {
    totalOrders: aggregate._count.id,
    totalRevenue: aggregate._sum.total?.toNumber() ?? 0,
    averageOrderValue: aggregate._avg.total?.toNumber() ?? 0,
    ordersByStatus: this.mapGroupedStatus(grouped),
  };
}
```

**Patrón de include para admin** (incluye datos del usuario, no disponible en el endpoint de usuario):

```typescript
private readonly adminOrderInclude = {
  user: {
    select: { id: true, email: true, firstName: true, lastName: true },
  },
  items: {
    include: {
      product: {
        include: {
          images: { orderBy: { order: 'asc' as const }, take: 1 },
        },
      },
    },
  },
};
```

#### Servicio — `admin-orders.service.ts`

```typescript
// Contrato del servicio
interface AdminOrdersServiceContract {
  findAll(filters: AdminOrderFilters, page: number, limit: number): Promise<PaginatedAdminOrders>;
  findById(id: string): Promise<AdminOrderDetail>;
  findByOrderNumber(orderNumber: string): Promise<AdminOrderDetail>;
  updateStatus(id: string, dto: UpdateOrderStatusDto): Promise<OrderStatusUpdateResult>;
}
```

**Flujo de `updateStatus`:**

```
1. findByIdForAdmin(id) → 404 si no existe
2. orderStatusValidationService.validate(current, requested) → 400 si transición inválida
3. if (requested === 'cancelled'):
     → prisma.$transaction():
         a. order.update({ status: 'cancelled', notes })
         b. stockManagementService.increaseStock(orderItems)   ← reutilizar existente
         c. stockManagementService.recordStockChange(changes)  ← reutilizar existente
     → emitir OrderStatusChangedEvent post-commit
4. else:
     → order.update({ status, notes })
     → emitir OrderStatusChangedEvent
5. return { id, orderNumber, status, updatedAt }
```

**Importante:** `StockManagementService` ya existe en `src/modules/orders/services/stock-management.service.ts`. El `AdminOrdersModule` debe importar `OrdersModule` (si exporta `StockManagementService`) o recibir el `PrismaService` directamente para la transacción. Ver [Decisión D-1](#decisión-d-1-reutilización-de-stockmanagementservice).

#### Controlador — `admin-orders.controller.ts`

```typescript
@Controller('admin/orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.admin)
@ApiTags('Admin - Orders')
export class AdminOrdersController {
  // GET  /api/admin/orders
  // GET  /api/admin/orders/number/:orderNumber   ← DEBE ir antes de /:id
  // GET  /api/admin/orders/:id
  // PUT  /api/admin/orders/:id/status
}
```

**Atención al orden de rutas:** `/number/:orderNumber` debe declararse **antes** de `/:id` para evitar que NestJS interprete `number` como un UUID.

---

### 3.3 AdminStockModule

#### Repositorio — `admin-stock.repository.ts`

```typescript
// Contrato del repositorio
interface StockHistoryRepositoryContract {
  findAll(
    filters: StockHistoryFilters,
    pagination: { page: number; limit: number },
  ): Promise<{ history: StockHistoryItem[]; total: number }>;

  findByProductId(
    productId: string,
    filters: Omit<StockHistoryFilters, 'productId'>,
    pagination: { page: number; limit: number },
  ): Promise<{ history: StockHistoryItem[]; total: number }>;

  productExists(productId: string): Promise<boolean>;
}
```

La query base para el historial:

```typescript
private buildWhereClause(filters: StockHistoryFilters): Prisma.StockHistoryWhereInput {
  return {
    ...(filters.productId && { productId: filters.productId }),
    ...(filters.dateFrom || filters.dateTo) && {
      createdAt: {
        ...(filters.dateFrom && { gte: new Date(filters.dateFrom) }),
        ...(filters.dateTo && { lte: new Date(filters.dateTo) }),
      },
    },
  };
}
```

#### Controlador — `admin-stock.controller.ts`

```typescript
@Controller('admin/stock')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.admin)
@ApiTags('Admin - Stock')
export class AdminStockController {
  // GET  /api/admin/stock/history
  // GET  /api/admin/stock/history/:productId   ← debe ir antes si hubiera conflicto
  // PUT  /api/admin/stock/threshold             ← opcional MVP
}
```

**Sobre `PUT /threshold`:** La persistencia del umbral requiere una tabla de configuración en BD o sobrescribir una variable de entorno en runtime (mala práctica). Decisión: **implementar como tabla `AppConfig`** con una sola fila `{ key: 'STOCK_LOW_THRESHOLD', value: '10' }`. Ver [Decisión D-2](#decisión-d-2-persistencia-del-umbral-de-stock).

---

### 3.4 Máquina de Estados de Pedidos

#### `order-status-validation.service.ts`

```typescript
// Transiciones válidas (grafo dirigido)
const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending:    ['confirmed', 'cancelled'],
  confirmed:  ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped:    ['delivered'],         // NO cancelled desde aquí
  delivered:  [],                    // Estado terminal
  cancelled:  [],                    // Estado terminal
};

@Injectable()
export class OrderStatusValidationService {
  validate(current: OrderStatus, next: OrderStatus): void {
    const allowed = VALID_TRANSITIONS[current];
    if (!allowed.includes(next)) {
      throw new BadRequestException({
        message: ERROR_CODES.INVALID_STATUS_TRANSITION,
        details: { currentStatus: current, requestedStatus: next },
      });
    }
  }

  isCancellation(next: OrderStatus): boolean {
    return next === OrderStatus.cancelled;
  }
}
```

**Matriz de transiciones:**

| Desde \ Hacia | pending | confirmed | processing | shipped | delivered | cancelled |
|--------------|---------|-----------|------------|---------|-----------|-----------|
| pending      | —       | ✅        | ❌         | ❌      | ❌        | ✅        |
| confirmed    | ❌      | —         | ✅         | ❌      | ❌        | ✅        |
| processing   | ❌      | ❌        | —          | ✅      | ❌        | ✅        |
| shipped      | ❌      | ❌        | ❌         | —       | ✅        | ❌        |
| delivered    | ❌      | ❌        | ❌         | ❌      | —         | ❌        |
| cancelled    | ❌      | ❌        | ❌         | ❌      | ❌        | —         |

---

### 3.5 Transacción de Cancelación

La cancelación es la única operación con efectos secundarios en stock. Se ejecuta dentro de `prisma.$transaction()` para garantizar atomicidad.

```typescript
// Pseudocódigo del flujo transaccional en AdminOrdersService.updateStatus()
async updateStatus(id: string, dto: UpdateOrderStatusDto): Promise<OrderStatusUpdateResult> {
  const order = await this.repository.findByIdForAdmin(id);
  if (!order) throw new NotFoundException(ERROR_CODES.ORDER_NOT_FOUND);

  this.statusValidation.validate(order.status as OrderStatus, dto.status);

  if (this.statusValidation.isCancellation(dto.status)) {
    // Transacción atómica: estado + stock + historial
    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id },
        data: { status: dto.status, notes: dto.notes, updatedAt: new Date() },
        select: { id: true, orderNumber: true, status: true, updatedAt: true },
      });

      // Devolver stock usando prisma transaccional (tx), no el prisma global
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
        await tx.stockHistory.create({
          data: {
            productId: item.productId,
            productName: item.product.name,
            previousStock: item.product.stock,
            newStock: item.product.stock + item.quantity,
            reason: `Pedido cancelado: ${order.orderNumber}`,
          },
        });
      }

      return updated;
    });

    // Post-commit: emitir evento (no crítico, fuera de la transacción)
    this.eventEmitter.emit(
      EVENT_NAMES.order.cancelled,
      new OrderStatusChangedEvent(id, order.status, dto.status),
    );

    return result;
  }

  // Caso no-cancelación: update simple
  const result = await this.prisma.order.update({ ... });
  this.eventEmitter.emit(EVENT_NAMES.order.updated, new OrderStatusChangedEvent(...));
  return result;
}
```

**Nota sobre el stock al cancelar:** El repositorio necesita que `findByIdForAdmin` incluya `items.product.stock` para calcular el `previousStock` en StockHistory. Si `stock` no viene en el include actual, agregar `product: { select: { id: true, name: true, stock: true } }` en `admin-orders.repository.ts`.

---

### 3.6 Arquitectura de Eventos

#### Evento nuevo — `order-status-changed.event.ts`

```typescript
// src/modules/admin/admin-orders/events/order-status-changed.event.ts
export class OrderStatusChangedEvent {
  constructor(
    public readonly orderId: string,
    public readonly previousStatus: string,
    public readonly newStatus: string,
    public readonly orderNumber?: string,
  ) {}
}
```

#### Listener nuevo — `stock-return.listener.ts`

```typescript
// src/modules/admin/admin-orders/listeners/stock-return.listener.ts
@Injectable()
export class StockReturnListener {
  constructor(private readonly logger: LoggerService) {}

  @OnEvent(EVENT_NAMES.order.cancelled)
  handleOrderCancelled(event: OrderStatusChangedEvent): void {
    // El stock ya fue devuelto DENTRO de la transacción en el servicio.
    // Este listener solo registra el evento para auditoría o notificaciones futuras.
    this.logger.log(`Order ${event.orderId} cancelled — stock already returned in transaction`);
  }
}
```

**Razón:** La devolución de stock ocurre DENTRO de `$transaction()`, no en este listener. El listener es solo para acciones no críticas (logging, notificaciones futuras). Esto evita inconsistencias si el listener falla.

#### Flujo completo de eventos

```
PUT /api/admin/orders/:id/status
  └─ AdminOrdersService.updateStatus()
       ├─ [si cancelled] prisma.$transaction()
       │     ├─ order.update(status='cancelled')
       │     ├─ product.update(stock += quantity) × N items
       │     └─ stockHistory.create() × N items
       └─ eventEmitter.emit('order.cancelled', OrderStatusChangedEvent)
            └─ StockReturnListener.handleOrderCancelled() [logging]
```

---

### 3.7 DTOs

#### `admin-order-query.dto.ts`

```typescript
export class AdminOrderQueryDto {
  @IsOptional() @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsOptional() @IsUUID()
  userId?: string;

  @IsOptional() @IsString() @MinLength(2)
  search?: string;  // busca en orderNumber, email, firstName, lastName

  @IsOptional() @IsISO8601()
  dateFrom?: string;

  @IsOptional() @IsISO8601()
  dateTo?: string;

  @IsOptional() @Type(() => Number) @IsNumber() @Min(0)
  minTotal?: number;

  @IsOptional() @Type(() => Number) @IsNumber() @Min(0)
  maxTotal?: number;

  @IsOptional() @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @IsOptional() @IsEnum(['newest', 'oldest', 'total-asc', 'total-desc'])
  sort?: 'newest' | 'oldest' | 'total-asc' | 'total-desc';

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number = 1;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50)
  limit?: number = 10;
}
```

#### `update-order-status.dto.ts`

```typescript
export class UpdateOrderStatusDto {
  @IsNotEmpty() @IsEnum(OrderStatus)
  status: OrderStatus;

  @IsOptional() @IsString() @MaxLength(500)
  notes?: string;
}
```

#### `stock-history-query.dto.ts`

```typescript
export class StockHistoryQueryDto {
  @IsOptional() @IsUUID()
  productId?: string;

  @IsOptional() @IsISO8601()
  dateFrom?: string;

  @IsOptional() @IsISO8601()
  dateTo?: string;

  @IsOptional() @IsEnum(['newest', 'oldest'])
  sort?: 'newest' | 'oldest' = 'newest';

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number = 1;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100)
  limit?: number = 20;
}
```

#### `update-stock-threshold.dto.ts` (opcional)

```typescript
export class UpdateStockThresholdDto {
  @IsNotEmpty() @Type(() => Number) @IsInt() @Min(0)
  threshold: number;
}
```

---

### 3.8 Interfaces de Dominio

#### `admin-order-detail.interface.ts`

```typescript
export interface AdminOrderDetail {
  id: string;
  orderNumber: string;
  userId: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  items: Array<{
    id: string;
    productId: string;
    product: {
      id: string;
      name: string;
      slug: string;
      images: Array<{ id: string; url: string; alt: string; isPrimary: boolean }>;
    };
    quantity: number;
    price: number;
    subtotal: number;
  }>;
  shippingAddress: Record<string, unknown>;
  paymentMethod: string;
  subtotal: number;
  shipping: number;
  total: number;
  status: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

#### `order-summary.interface.ts`

```typescript
export interface OrderSummary {
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
```

#### `stock-history-item.interface.ts`

```typescript
export interface StockHistoryItem {
  id: string;
  productId: string;
  productName: string;
  previousStock: number;
  newStock: number;
  change: number;        // newStock - previousStock (calculado en mapper)
  reason?: string;
  createdAt: Date;
}
```

#### `admin-order-filters.interface.ts`

```typescript
export interface AdminOrderFilters {
  status?: string;
  userId?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  minTotal?: number;
  maxTotal?: number;
  paymentMethod?: string;
  sort?: 'newest' | 'oldest' | 'total-asc' | 'total-desc';
}
```

---

### 3.9 Errores

Los siguientes errores ya existen en `src/common/constants/error-codes.ts` y deben usarse sin modificación:

```typescript
ERROR_CODES.INVALID_STATUS_TRANSITION  // Para transiciones inválidas
ERROR_CODES.ORDER_NOT_FOUND            // Para pedido no encontrado
ERROR_CODES.PRODUCT_NOT_FOUND          // Para historial de producto inexistente
```

No es necesario agregar nuevos códigos de error para Fase 7.

---

## 4. Diseño Técnico — Fase 8

### 4.1 Swagger — Decoradores pendientes

Módulos que **no** tienen decoradores Swagger completos (implementados en Fases 4–7):

| Módulo | Controlador | Decoradores mínimos requeridos |
|--------|-------------|-------------------------------|
| Cart | `cart.controller.ts` | `@ApiTags`, `@ApiOperation`, `@ApiResponse`, `@ApiBearerAuth` |
| Orders | `orders.controller.ts` | Ídem + `@ApiBody` en POST |
| Shipping | `shipping.controller.ts` | `@ApiTags`, `@ApiOperation`, `@ApiResponse`, `@ApiBody` |
| Admin Orders | `admin-orders.controller.ts` | Ídem + `@ApiQuery` en GET listado |
| Admin Stock | `admin-stock.controller.ts` | Ídem + `@ApiParam` en `:productId` |

**Convención de tags (mantener consistencia con módulos existentes):**

```typescript
@ApiTags('Cart')
@ApiTags('Orders')
@ApiTags('Shipping')
@ApiTags('Admin - Orders')
@ApiTags('Admin - Stock')
```

### 4.2 Health Checks — `src/health/`

```
src/health/
├── health.module.ts
└── health.controller.ts
```

```typescript
@Controller()
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: PrismaHealthIndicator,
    private memory: MemoryHealthIndicator,
  ) {}

  @Get('health')
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.memory.checkHeap('memory_heap', 300 * 1024 * 1024), // 300MB
    ]);
  }

  @Get('health/ready')
  @HealthCheck()
  readiness() {
    return this.health.check([() => this.db.pingCheck('database')]);
  }

  @Get('health/live')
  liveness() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
```

**Nota:** `PrismaHealthIndicator` no existe en `@nestjs/terminus`. Implementar un indicator personalizado usando `this.prisma.$queryRaw\`SELECT 1\`` o usar `HttpHealthIndicator` si el servicio tiene un endpoint de ping.

```typescript
// Custom Prisma health indicator
@Injectable()
export class PrismaHealthIndicator extends HealthIndicator {
  constructor(private readonly prisma: PrismaService) { super(); }

  async pingCheck(key: string): Promise<HealthIndicatorResult> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return this.getStatus(key, true);
    } catch {
      return this.getStatus(key, false);
    }
  }
}
```

### 4.3 Endpoint de Versión

```typescript
// En un módulo existente (ej: AppModule) o en HealthController
@Get('api/version')
@Public()
version() {
  return {
    version: process.env.npm_package_version ?? '1.0.0',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  };
}
```

### 4.4 Verificaciones de pipeline global

Antes de considerar la Fase 8 completa, verificar manualmente:

| Check | Comando/URL | Criterio |
|-------|------------|---------|
| Rate limiting login | 6 requests a `POST /api/auth/login` | 6ta retorna 429 |
| Rate limiting registro | 4 requests a `POST /api/auth/register` | 4ta retorna 429 |
| Timeout | Request que tarda >30s | Retorna 408 |
| Compresión | `curl -H "Accept-Encoding: gzip" /api/products` | Header `Content-Encoding: gzip` |
| Transform interceptor | Cualquier endpoint exitoso | Respuesta tiene `{ success: true, data: ... }` |
| Error format | Endpoint con error | Respuesta tiene `{ success: false, error: { code, message } }` |
| Swagger | `GET /api/swagger` | UI carga y muestra todos los endpoints |
| Health | `GET /health` | `{ status: "ok" }` |

---

## 5. Diseño Técnico — Fase 9

### 5.1 Plataforma seleccionada: Railway

Railway es la opción recomendada para MVP porque:
- Deploy directo desde GitHub en push a `main`
- PostgreSQL como servicio integrado
- Variables de entorno gestionadas desde la UI
- Health checks automáticos con el endpoint `/health`
- Sin costo fijo para proyectos pequeños (pay-per-use)

### 5.2 Preparación del código para producción

**`main.ts` — ajustes para producción:**

```typescript
// Cookies seguras solo en producción
const isProduction = process.env.NODE_ENV === 'production';

app.use(cookieParser(process.env.COOKIE_SECRET));
// El interceptor TransformInterceptor ya formatea las respuestas
// No hay cambios en el pipeline para producción
```

**`prisma.service.ts` — logging condicional:**

```typescript
// Solo loggear queries en desarrollo
const log = process.env.NODE_ENV === 'development'
  ? ['query', 'info', 'warn', 'error']
  : ['warn', 'error'];
```

### 5.3 Variables de entorno de producción

Configurar en Railway dashboard (nunca commitear al repo):

```env
DATABASE_URL=postgresql://...railway.app:5432/railway
JWT_SECRET=<min 64 chars aleatorios>
COOKIE_SECRET=<min 64 chars aleatorios>
NODE_ENV=production
CORS_ORIGIN=https://tu-frontend.vercel.app
PORT=4000
JWT_EXPIRES_IN=7d
FREE_SHIPPING_THRESHOLD=10000
SHIPPING_COST=1500
```

### 5.4 Proceso de deploy

```bash
# 1. Ejecutar migraciones en producción (Railway CLI o desde panel)
npx prisma migrate deploy

# 2. Ejecutar seed solo la primera vez
npx prisma db seed

# 3. El build se ejecuta automáticamente en Railway con:
npm run build
node dist/main.js
```

**`Procfile` o `package.json` start script:**

```json
{
  "scripts": {
    "start:prod": "node dist/main.js"
  }
}
```

---

## 6. Decisiones de Diseño y Trade-offs

### Decisión D-1: Reutilización de StockManagementService

**Problema:** `StockManagementService` vive en `src/modules/orders/services/`. `AdminOrdersModule` necesita devolver stock al cancelar.

**Opciones consideradas:**

| Opción | Pros | Contras |
|--------|------|---------|
| A) Importar `OrdersModule` en `AdminOrdersModule` | Reutiliza código | Acoplamiento entre módulos admin y de usuario |
| B) Duplicar la lógica de stock en `AdminOrdersService` | Independencia total | Violación de DRY |
| C) Mover `StockManagementService` a `admin/shared/` | Centralizado | Breaking change en `OrdersModule` |
| D) Usar `PrismaService` directamente en la transacción | Simple, sin acoplamiento | Lógica de stock duplicada inline |

**Decisión: Opción D para MVP.** La lógica de cancelación (increment stock + create StockHistory) es suficientemente simple para escribir inline dentro de `$transaction()`. Si crece en complejidad, se extrae a un servicio compartido en un refactor posterior.

**Razón:** Mantener los módulos admin independientes de los módulos de usuario evita dependencias circulares y simplifica el árbol de imports.

---

### Decisión D-2: Persistencia del umbral de stock bajo

**Problema:** `PUT /api/admin/stock/threshold` necesita persistir un valor configurable.

**Opciones consideradas:**

| Opción | Pros | Contras |
|--------|------|---------|
| A) Variable de entorno | Simple | Requiere redeploy para cambiar |
| B) Tabla `AppConfig` en BD | Persistente, cambiable en runtime | Añade tabla y migración |
| C) No implementar | Menos trabajo | Feature incompleto |

**Decisión: Implementar como tabla `AppConfig` (Opción B)**, pero marcar como **opcional para MVP**. Si el tiempo apremia, omitir el endpoint y leer el valor fijo de env var.

```prisma
// Agregar a prisma/schema.prisma
model AppConfig {
  key       String   @id
  value     String
  updatedAt DateTime @updatedAt
}
```

---

### Decisión D-3: Resumen estadístico en listado de pedidos

**Problema:** `GET /api/admin/orders` debe retornar tanto la lista paginada como el resumen estadístico. ¿Se calcula el resumen sobre todos los registros o solo la página actual?

**Decisión: El resumen se calcula sobre todos los registros que cumplan los filtros**, no solo la página actual. Se ejecutan dos queries en paralelo:

```typescript
const [{ orders, total }, summary] = await Promise.all([
  this.repository.findAllWithFilters(filters, { page, limit }),
  this.repository.calculateSummary(filters),
]);
```

**Razón:** El resumen estadístico pierde sentido si solo refleja los 10 registros de la página actual. El costo de la query adicional es bajo dado que usa `aggregate` y `groupBy` de Prisma (queries eficientes).

---

### Decisión D-4: Orden de rutas en AdminOrdersController

**Problema:** NestJS resuelve rutas por orden de declaración. `/number/:orderNumber` y `/:id` pueden entrar en conflicto.

**Solución:** Declarar rutas literales antes que rutas con parámetros. Patrón ya establecido en `ProductsController` (Fase 3, `slug/:slug` antes de `/:id`).

```typescript
@Controller('admin/orders')
export class AdminOrdersController {
  @Get('number/:orderNumber')  // ← PRIMERO
  findByOrderNumber(...) {}

  @Get(':id')                  // ← DESPUÉS
  findById(...) {}
}
```

---

## 7. Checklist de Implementación

### Fase 7 — Admin Pedidos y Stock

#### AdminOrdersModule

- [ ] Crear `admin-orders.module.ts` — importa `PrismaModule`, `OrdersModule` (opcional), registra listeners
- [ ] Crear `admin-orders.repository.ts` — `findAllWithFilters`, `findByIdForAdmin`, `findByOrderNumberForAdmin`, `updateStatus`, `calculateSummary`
- [ ] Crear `order-status-validation.service.ts` — tabla de transiciones, método `validate()`, método `isCancellation()`
- [ ] Crear `order-summary.service.ts` — opcional, puede ir inline en el repositorio
- [ ] Crear `admin-orders.service.ts` — `findAll`, `findById`, `findByOrderNumber`, `updateStatus` con transacción
- [ ] Crear `admin-orders.controller.ts` — 4 endpoints en orden correcto (`/number/:orderNumber` antes de `/:id`)
- [ ] Crear `admin-order-query.dto.ts` — todos los filtros con validaciones
- [ ] Crear `update-order-status.dto.ts` — status + notes
- [ ] Crear interfaces de dominio — `AdminOrderDetail`, `OrderSummary`, `AdminOrderFilters`
- [ ] Crear `order-status-changed.event.ts`
- [ ] Crear `stock-return.listener.ts` — solo logging, stock ya devuelto en transacción
- [ ] Registrar `AdminOrdersModule` en `AppModule`

#### AdminStockModule

- [ ] Crear `admin-stock.module.ts` — importa `PrismaModule`
- [ ] Crear `admin-stock.repository.ts` — `findAll`, `findByProductId`, `productExists`
- [ ] Crear `admin-stock.service.ts` — `findAll`, `findByProductId` con validación de producto existente
- [ ] Crear `admin-stock.controller.ts` — 3 endpoints (history global, history por producto, threshold opcional)
- [ ] Crear `stock-history-query.dto.ts`
- [ ] Crear `update-stock-threshold.dto.ts` (si se implementa threshold)
- [ ] Crear interfaces de dominio — `StockHistoryItem`, `StockHistoryFilters`
- [ ] (Opcional) Crear migración Prisma para tabla `AppConfig` si se implementa threshold
- [ ] Registrar `AdminStockModule` en `AppModule`

### Fase 8 — Documentación y Optimización

- [ ] Agregar `@ApiTags`, `@ApiOperation`, `@ApiResponse` a `CartController`
- [ ] Agregar decoradores Swagger a `OrdersController`
- [ ] Agregar decoradores Swagger a `ShippingController`
- [ ] Agregar decoradores Swagger a `AdminOrdersController`
- [ ] Agregar decoradores Swagger a `AdminStockController`
- [ ] Agregar `@ApiProperty` a todos los DTOs de Fases 4–7
- [ ] Crear `src/health/health.module.ts` con `TerminusModule`
- [ ] Crear `src/health/health.controller.ts` — `/health`, `/health/ready`, `/health/live`
- [ ] Crear `PrismaHealthIndicator` personalizado
- [ ] Crear endpoint `GET /api/version`
- [ ] Verificar rate limiting en login y registro
- [ ] Verificar timeout interceptor (30s)
- [ ] Verificar compresión en responses grandes
- [ ] Exportar OpenAPI JSON desde Swagger
- [ ] Actualizar README con comandos y arquitectura

### Fase 9 — Despliegue

- [ ] Crear cuenta en Railway y conectar repositorio
- [ ] Crear instancia PostgreSQL en Railway
- [ ] Configurar variables de entorno en Railway dashboard
- [ ] Ejecutar `npx prisma migrate deploy` en Railway
- [ ] Ejecutar `npx prisma db seed` (primera vez únicamente)
- [ ] Verificar `/health` en producción
- [ ] Configurar `CORS_ORIGIN` con URL del frontend en producción
- [ ] Verificar cookies con `Secure: true` en HTTPS
- [ ] Conectar frontend Next.js con `NEXT_PUBLIC_API_URL` apuntando al backend de Railway

---

## Apéndice — Dependencias entre módulos (Fase 7)

```
AdminOrdersModule
  imports:
    - PrismaModule          (para PrismaService en repository y transacciones)
    - EventEmitterModule    (global, no necesita import explícito)
  providers:
    - AdminOrdersRepository
    - AdminOrdersService
    - OrderStatusValidationService
    - StockReturnListener   (listener de eventos)
    - AdminOrdersController

AdminStockModule
  imports:
    - PrismaModule
  providers:
    - StockHistoryRepository
    - AdminStockService
    - AdminStockController
```

---

*Este RFC se considera implementado cuando todos los items del checklist de la Fase correspondiente estén marcados y los hitos verificados según `PLANIFICACION_PROYECTO.md`.*
