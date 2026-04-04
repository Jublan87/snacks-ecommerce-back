import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  context?: string;
  message: string;
  [key: string]: unknown;
}

/**
 * Logger personalizado con formato estructurado.
 * - En producción: salida JSON (una línea por entrada) para agregación en sistemas de log.
 * - En desarrollo: formato legible con timestamp, nivel, contexto y mensaje.
 * - Incluye contexto y timestamp en todas las entradas.
 */
@Injectable()
export class LoggerService {
  private readonly isProduction: boolean;

  constructor(private readonly configService: ConfigService) {
    this.isProduction = this.configService.get<string>('app.nodeEnv') === 'production';
  }

  error(message: string, context?: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
  error(
    message: string,
    contextOrMeta?: string | Record<string, unknown>,
    meta?: Record<string, unknown>,
  ): void {
    this.log('error', message, contextOrMeta, meta);
  }

  warn(message: string, context?: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  warn(
    message: string,
    contextOrMeta?: string | Record<string, unknown>,
    meta?: Record<string, unknown>,
  ): void {
    this.log('warn', message, contextOrMeta, meta);
  }

  info(message: string, context?: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
  info(
    message: string,
    contextOrMeta?: string | Record<string, unknown>,
    meta?: Record<string, unknown>,
  ): void {
    this.log('info', message, contextOrMeta, meta);
  }

  debug(message: string, context?: string, meta?: Record<string, unknown>): void;
  debug(message: string, meta?: Record<string, unknown>): void;
  debug(
    message: string,
    contextOrMeta?: string | Record<string, unknown>,
    meta?: Record<string, unknown>,
  ): void {
    this.log('debug', message, contextOrMeta, meta);
  }

  private log(
    level: LogLevel,
    message: string,
    contextOrMeta?: string | Record<string, unknown>,
    meta?: Record<string, unknown>,
  ): void {
    const context = typeof contextOrMeta === 'string' ? contextOrMeta : undefined;
    const mergedMeta =
      typeof contextOrMeta === 'object' && contextOrMeta !== null ? contextOrMeta : (meta ?? {});

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(context ? { context } : {}),
      ...mergedMeta,
    };

    const output = this.isProduction ? JSON.stringify(entry) : this.formatDev(entry);

    switch (level) {
      case 'error':
        console.error(output);
        break;
      case 'warn':
        console.warn(output);
        break;
      case 'debug':
        if (!this.isProduction) {
          console.debug(output);
        }
        break;
      default:
        console.log(output);
    }
  }

  private formatDev(entry: LogEntry): string {
    const { timestamp, level, context, message, ...rest } = entry;
    const ctx = context ? ` [${context}]` : '';
    const meta = Object.keys(rest).length ? ` ${JSON.stringify(rest)}` : '';
    return `${timestamp} ${level.toUpperCase().padEnd(5)}${ctx} ${message}${meta}`;
  }
}
