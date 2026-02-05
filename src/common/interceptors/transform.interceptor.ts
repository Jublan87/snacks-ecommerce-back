import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T = unknown> {
  success: true;
  data: T;
  timestamp: string;
}

/**
 * Interceptor que transforma todas las respuestas exitosas a un formato estándar:
 * { success: true, data: any, timestamp: string }
 * No envuelve si el cuerpo ya tiene la forma esperada (evita doble anidación).
 */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        if (data != null && this.isApiResponse(data)) {
          return data as ApiResponse<T>;
        }
        return {
          success: true as const,
          data,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }

  private isApiResponse(value: unknown): value is ApiResponse<unknown> {
    return (
      typeof value === 'object' &&
      value !== null &&
      'success' in value &&
      (value as ApiResponse<unknown>).success === true &&
      'timestamp' in value
    );
  }
}
