# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run start:dev        # Watch mode (port 4000)
npm run build            # Compile TypeScript
npx tsc --noEmit         # Type-check without emitting

# Code quality
npm run lint             # ESLint with auto-fix
npm run format           # Prettier

# Testing
npm run test             # All unit tests
npm run test:watch       # Watch mode
npm run test:cov         # Coverage report
npm run test:e2e         # End-to-end tests

# Prisma
npm run prisma:generate  # Regenerate Prisma client after schema changes
npm run prisma:migrate   # Run pending migrations (dev)
npm run prisma:seed      # Seed database (28 products, 6 categories, admin user)
npm run prisma:studio    # Open Prisma Studio GUI
```

**Swagger UI:** `http://localhost:4000/api/swagger`
**Default admin:** `admin@snacks.com` / `Admin-123`

## Architecture

### Global Setup (main.ts)
- Global prefix: `/api`
- Global `ValidationPipe`: `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`, `enableImplicitConversion: true`
- Interceptor chain: `LoggingInterceptor` → `TimeoutInterceptor` → `TransformInterceptor`
- Exception filters: `AllExceptionsFilter` → `PrismaExceptionFilter`

### Module Structure
Every domain module follows this layout:
```
modules/<domain>/
  interfaces/      ← Pure TypeScript domain interfaces (no Prisma types)
  dto/             ← class-validator + @ApiProperty DTOs
  services/        ← Domain services (optional, for complex logic)
  <domain>.repository.ts   ← extends BaseRepository, converts Prisma → domain interfaces
  <domain>.service.ts      ← injects repository, throws NotFoundException
  <domain>.controller.ts   ← injects service, @ApiTags/@Public/guards
  <domain>.module.ts       ← imports: [PrismaModule], exports: [Service]
```

### Repository Pattern
All repositories extend `src/database/repositories/base.repository.ts`:
```typescript
export abstract class BaseRepository<T, CreateInput, UpdateInput, WhereInput, Select = object>
```
Built-in: `findById`, `findAll`, `findOne`, `create`, `update`, `delete`, `count`, `exists`.

**Prisma Decimal in Prisma v7:** Do NOT import `Decimal` from `@prisma/client/runtime/library` — it is not available. Use duck-typing instead:
```typescript
private toNumber(decimal: { toNumber(): number } | null): number | null {
  return decimal !== null ? decimal.toNumber() : null;
}
```
Convert all `Decimal` fields to `number` inside repository mappers before returning domain interfaces.

### Authentication
- JWT stored in HttpOnly cookie `jwt_token` AND accepted via `Authorization: Bearer` header
- `@Public()` decorator (`src/common/decorators/public.decorator.ts`) marks routes as unauthenticated
- `@Roles(UserRole.admin)` + `RolesGuard` for protected routes
- `@CurrentUser()` injects the authenticated `SessionUser` object

### Boolean Query Params
With `enableImplicitConversion: true`, `Boolean("false")` = `true`. Use `obj[key]` in `@Transform` to read the raw string before conversion:
```typescript
@Transform(({ obj, key }) => { const raw = obj[key]; return raw === 'true' || raw === true; })
```

### Pagination
`src/common/utils/pagination.util.ts` exports `calculatePaginationMeta` and `buildPaginatedResponse`. Use `Promise.all([findMany, count])` for parallel DB queries.

### Route Ordering
In NestJS, literal path segments must be declared **before** param segments. Example in `ProductsController`:
```typescript
@Get('slug/:slug')  // ← MUST come before /:id
async findBySlug(...) {}

@Get(':id')
async findById(...) {}
```

### Error Codes
Centralized at `src/common/constants/error-codes.ts`. Use these when throwing `BadRequestException` / `NotFoundException`.

### Event System
`EventEmitterModule` is configured globally with wildcard support (`delimiter: '.'`). Event type constants live in `src/common/events/event-types.ts`.

## Environment Variables
Required: `DATABASE_URL`, `JWT_SECRET` (min 32 chars), `COOKIE_SECRET` (min 32 chars)
Optional: `PORT` (default 4000), `JWT_EXPIRES_IN` (default 7d), `CORS_ORIGIN` (default http://localhost:3000), `FREE_SHIPPING_THRESHOLD`, `SHIPPING_COST`

### Cloudinary (image upload)
Required when using `CloudinaryImageAdapter` (production):
- `CLOUDINARY_CLOUD_NAME` — Cloud name from your Cloudinary dashboard
- `CLOUDINARY_API_KEY` — API key from your Cloudinary dashboard
- `CLOUDINARY_API_SECRET` — API secret from your Cloudinary dashboard

For local development without Cloudinary credentials, swap `CloudinaryImageAdapter` for `PlaceholderImageAdapter` in `admin-upload.module.ts`.

## Postman Collection

File: `docs/Snacks-Ecommerce.postman_collection.json`

**MANDATORY**: When creating, modifying, or deleting an endpoint (controller route), you MUST update the Postman collection accordingly:
- Each module folder has two subfolders: **Local** (`http://localhost:4000`) and **Render** (`https://ecommerce-snacks-back.onrender.com`)
- New endpoints must be added to BOTH Local and Render subfolders
- Deleted endpoints must be removed from BOTH subfolders
- Modified paths must be updated in BOTH subfolders
- Include proper method, headers (Bearer auth if protected), body (if POST/PUT), and description
- Keep the collection JSON valid (Postman v2.1.0 schema)

## Prisma Schema Key Models
- **User** — role: `customer | admin`
- **Category** — self-referencing hierarchy (parentId), `isActive`, `order`
- **Product** — `salePrice`/`costPrice`/`discountPrice` as `Decimal`, `isActive`, `isFeatured`, `stock`
- **ProductImage** — `isPrimary` flag, ordered by `order`
- **ProductVariant** + **VariantOption** — variants with `priceModifier` as `Decimal`
- **Cart** + **CartItem** — unique constraint on `(cartId, productId)`
- **Order** + **OrderItem** — `OrderStatus` enum, `PaymentMethod` enum
- **StockHistory** — audit trail for stock changes
