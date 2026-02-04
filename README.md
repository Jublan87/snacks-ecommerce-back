# snacks-ecommerce-back

API REST para el e-commerce de snacks (NestJS + Prisma + PostgreSQL).

## Hitos 0.1–0.4 (Configuración inicial)

### Requisitos

- Node.js 18+
- Docker (opcional, para BD local) o PostgreSQL instalado

### Base de datos con Docker

Para levantar PostgreSQL en local sin instalar nada en el sistema:

```bash
docker compose up -d
```

- Usuario: `snacks_user` | Contraseña: `snacks_password` | BD: `snacks_db` | Puerto: `5432`
- El `.env` ya incluye la `DATABASE_URL` correcta para este setup.
- Parar: `docker compose down`. Borrar datos: `docker compose down -v`.

### Conexión a PostgreSQL (Hito 0.5)

Tras levantar la BD con Docker e instalar dependencias:

```bash
npm run prisma:generate
npm run start:dev
```

Si la conexión es correcta, la app arranca sin error. `PrismaService` se conecta en `onModuleInit` y se desconecta en `onModuleDestroy`. Los modelos se añaden en Fase 1.

### Arranque rápido

1. **Instalar dependencias**
   ```bash
   npm install
   ```

2. **Variables de entorno**
   - Copiar `.env.example` a `.env`
   - Ajustar `DATABASE_URL`, `JWT_SECRET` y `COOKIE_SECRET` (mínimo 32 caracteres cada uno)

3. **Levantar el servidor**
   ```bash
   npm run start:dev
   ```
   - API disponible en: **http://localhost:4000/api**

### Verificación de hitos

- **0.1** Proyecto NestJS creado y servidor en `http://localhost:4000`
- **0.2** Dependencias en `package.json` (Prisma, JWT, Swagger, compression, etc.) — ejecutar `npm install`
- **0.3** Variables en `.env` con validación Joi (`src/config/validation.schema.ts` y `configuration.ts`)
- **0.4** CORS, cookie-parser, compression y ValidationPipe global en `main.ts`; prefijo `/api`
- **0.5** Conexión a PostgreSQL con Prisma (`PrismaModule`, `PrismaService`, `prisma/schema.prisma`)