import { PrismaService } from '../prisma.service';

/**
 * Repositorio base para extender en módulos.
 * Inyectar PrismaService y exponerlo para consultas tipadas.
 */
export abstract class BaseRepository {
  constructor(protected readonly prisma: PrismaService) {}
}
