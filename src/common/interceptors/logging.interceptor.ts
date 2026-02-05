import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';

export interface LogEntry {
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  timestamp: string;
  userAgent?: string;
}

/**
 * Interceptor que registra cada request con método, ruta, duración y status code
 * en formato estructurado (ideal para agregación en logs).
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse();
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const durationMs = Date.now() - start;
          const entry: LogEntry = {
            method: request.method,
            path: request.url,
            statusCode: response.statusCode,
            durationMs,
            timestamp: new Date().toISOString(),
            userAgent: request.get('user-agent'),
          };
          console.log(JSON.stringify({ level: 'http', ...entry }));
        },
        error: () => {
          const durationMs = Date.now() - start;
          const entry: LogEntry = {
            method: request.method,
            path: request.url,
            statusCode: response.statusCode || 500,
            durationMs,
            timestamp: new Date().toISOString(),
            userAgent: request.get('user-agent'),
          };
          console.log(JSON.stringify({ level: 'http', ...entry }));
        },
      }),
    );
  }
}
