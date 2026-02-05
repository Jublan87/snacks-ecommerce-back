# Patrón Repository - Guía de Uso

Este directorio contiene la implementación del patrón Repository para el acceso a datos usando Prisma.

## 📚 Conceptos

El patrón Repository abstrae la lógica de acceso a datos, proporcionando una interfaz más limpia y testeable. En lugar de usar `PrismaService` directamente en los servicios, usamos repositorios que encapsulan las operaciones de base de datos.

## 🏗️ Estructura

```
repositories/
├── interfaces/
│   └── base-repository.interface.ts  # Interfaz genérica para repositorios
├── base.repository.ts                # Implementación base con CRUD común
└── README.md                          # Esta documentación
```

## 🚀 Uso Básico

### 1. Crear un Repositorio Específico

Extiende `BaseRepository` y proporciona los tipos genéricos de Prisma:

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { BaseRepository } from './base.repository';
import { User, Prisma } from '@prisma/client';

@Injectable()
export class UsersRepository extends BaseRepository<
  User,
  Prisma.UserCreateInput,
  Prisma.UserUpdateInput,
  Prisma.UserWhereInput
> {
  constructor(prisma: PrismaService) {
    super(prisma, 'user'); // 'user' es el nombre del modelo en Prisma
  }

  // Métodos específicos del repositorio
  async findByEmail(email: string): Promise<User | null> {
    return this.findOne({ email });
  }

  async findActiveUsers(): Promise<User[]> {
    return this.findAll({ isActive: true });
  }
}
```

### 2. Registrar el Repositorio en el Módulo

```typescript
import { Module } from '@nestjs/common';
import { PrismaModule } from '../database/prisma.module';
import { UsersRepository } from './users.repository';

@Module({
  imports: [PrismaModule],
  providers: [UsersRepository],
  exports: [UsersRepository],
})
export class UsersModule {}
```

### 3. Usar el Repositorio en un Servicio

```typescript
import { Injectable } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { User } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async getUserById(id: string): Promise<User> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return user;
  }

  async createUser(data: Prisma.UserCreateInput): Promise<User> {
    return this.usersRepository.create(data);
  }
}
```

## 📋 Métodos Disponibles

Todos los repositorios que extienden `BaseRepository` tienen acceso a estos métodos:

### `findById(id: string, select?: Select): Promise<T | null>`
Busca un registro por su ID.

```typescript
const user = await usersRepository.findById('123');
```

### `findAll(where?: WhereInput, select?: Select): Promise<T[]>`
Busca todos los registros que cumplan con los criterios.

```typescript
const activeUsers = await usersRepository.findAll({ isActive: true });
```

### `findOne(where: WhereInput, select?: Select): Promise<T | null>`
Busca un único registro que cumpla con los criterios.

```typescript
const user = await usersRepository.findOne({ email: 'user@example.com' });
```

### `create(data: CreateInput, select?: Select): Promise<T>`
Crea un nuevo registro.

```typescript
const newUser = await usersRepository.create({
  email: 'user@example.com',
  firstName: 'John',
  lastName: 'Doe',
});
```

### `update(id: string, data: UpdateInput, select?: Select): Promise<T>`
Actualiza un registro existente. Lanza `NotFoundException` si no existe.

```typescript
const updatedUser = await usersRepository.update('123', {
  firstName: 'Jane',
});
```

### `delete(id: string): Promise<T>`
Elimina un registro por su ID. Lanza `NotFoundException` si no existe.

```typescript
await usersRepository.delete('123');
```

### `count(where?: WhereInput): Promise<number>`
Cuenta el número de registros que cumplen con los criterios.

```typescript
const totalUsers = await usersRepository.count();
const activeUsersCount = await usersRepository.count({ isActive: true });
```

### `exists(id: string): Promise<boolean>`
Verifica si existe un registro con el ID dado.

```typescript
if (await usersRepository.exists('123')) {
  // El usuario existe
}
```

## 🛡️ Manejo de Errores

El `BaseRepository` maneja automáticamente errores comunes de Prisma:

- **P2002** (Unique constraint): Se convierte en `ConflictException`
- **P2025** (Record not found): Se convierte en `NotFoundException`
- **P2003** (Foreign key constraint): Se convierte en `BadRequestException`

Todos los errores incluyen códigos de error estándar definidos en `ERROR_CODES`.

## 💡 Buenas Prácticas

1. **Un repositorio por modelo**: Crea un repositorio específico para cada modelo de Prisma.

2. **Métodos específicos en el repositorio**: Agrega métodos de búsqueda específicos del dominio en el repositorio, no en el servicio.

   ```typescript
   // ✅ Bien: método específico en el repositorio
   async findByEmail(email: string): Promise<User | null> {
     return this.findOne({ email });
   }

   // ❌ Mal: lógica de búsqueda en el servicio
   async getUserByEmail(email: string) {
     return this.prisma.user.findFirst({ where: { email } });
   }
   ```

3. **Usar select para optimizar**: Cuando solo necesites ciertos campos, usa `select`:

   ```typescript
   const users = await usersRepository.findAll(
     { isActive: true },
     { id: true, email: true, firstName: true }
   );
   ```

4. **No exponer PrismaService**: Los servicios no deben usar `PrismaService` directamente, siempre a través de repositorios.

## 🔍 Ejemplo Completo

```typescript
// users.repository.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { BaseRepository } from './base.repository';
import { User, Prisma } from '@prisma/client';

@Injectable()
export class UsersRepository extends BaseRepository<
  User,
  Prisma.UserCreateInput,
  Prisma.UserUpdateInput,
  Prisma.UserWhereInput
> {
  constructor(prisma: PrismaService) {
    super(prisma, 'user');
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.findOne({ email });
  }

  async findActiveUsers(): Promise<User[]> {
    return this.findAll({ isActive: true });
  }

  async countByRole(role: string): Promise<number> {
    return this.count({ role });
  }
}

// users.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { User, Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async getUserById(id: string): Promise<User> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return user;
  }

  async createUser(data: Prisma.UserCreateInput): Promise<User> {
    // Verificar que el email no existe
    const existingUser = await this.usersRepository.findByEmail(data.email);
    if (existingUser) {
      throw new ConflictException('El email ya está en uso');
    }
    
    return this.usersRepository.create(data);
  }
}
```

## 📖 Referencias

- [Prisma Client API Reference](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
- [NestJS Dependency Injection](https://docs.nestjs.com/providers)
- [Repository Pattern](https://martinfowler.com/eaaCatalog/repository.html)
