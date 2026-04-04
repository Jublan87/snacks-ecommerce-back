import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ERROR_CODES, ErrorCode } from '../constants/error-codes';

export interface ErrorResponseBody {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    statusCode: number;
    details?: unknown;
    timestamp: string;
  };
}

/**
 * Filtro global que captura todas las excepciones.
 * - Formatea respuestas de error de forma consistente.
 * - Registra errores 500 con stack trace.
 * - En producción no expone mensajes ni stack de errores internos.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly isProduction: boolean = false) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { statusCode, code, message, details } = this.normalizeException(exception);

    const body: ErrorResponseBody = {
      success: false,
      error: {
        code,
        message,
        statusCode,
        timestamp: new Date().toISOString(),
      },
    };

    if (details !== undefined) {
      body.error.details = details;
    }

    if (statusCode >= 500) {
      this.logger.error(
        `${request.method} ${request.url} ${statusCode} - ${message}`,
        exception instanceof Error
          ? (exception.stack ?? exception.message)
          : JSON.stringify(exception),
      );
    }

    response.status(statusCode).json(body);
  }

  private normalizeException(exception: unknown): {
    statusCode: number;
    code: ErrorCode;
    message: string;
    details?: unknown;
  } {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const { message, details } = this.parseExceptionResponse(exception);
      return { statusCode: status, code: this.httpStatusToErrorCode(status), message, details };
    }

    // Errores no HTTP (errores de servidor)
    const devMessage =
      exception instanceof Error ? exception.message : 'Error interno del servidor';
    const message = this.isProduction
      ? 'Ha ocurrido un error interno. Por favor, intente más tarde.'
      : devMessage;

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: ERROR_CODES.INTERNAL_ERROR,
      message,
    };
  }

  private parseExceptionResponse(exception: HttpException): { message: string; details?: unknown } {
    const exceptionResponse = exception.getResponse();

    if (typeof exceptionResponse !== 'object' || exceptionResponse === null) {
      const message = typeof exceptionResponse === 'string' ? exceptionResponse : exception.message;
      return { message };
    }

    const body = exceptionResponse as Record<string, unknown>;
    const { message, details: msgDetails } = this.parseBodyMessage(exception, body);
    const details = body.details ?? msgDetails ?? body.error;

    return { message, details };
  }

  private parseBodyMessage(
    exception: HttpException,
    body: Record<string, unknown>,
  ): { message: string; details?: unknown } {
    if (Array.isArray(body.message)) {
      return { message: (body.message as string[]).join('; '), details: body.message };
    }
    if (typeof body.message === 'string') {
      return { message: body.message };
    }
    return { message: exception.message };
  }

  private httpStatusToErrorCode(status: number): ErrorCode {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return ERROR_CODES.BAD_REQUEST;
      case HttpStatus.UNAUTHORIZED:
        return ERROR_CODES.UNAUTHORIZED;
      case HttpStatus.FORBIDDEN:
        return ERROR_CODES.FORBIDDEN;
      case HttpStatus.NOT_FOUND:
        return ERROR_CODES.NOT_FOUND;
      case HttpStatus.CONFLICT:
        return ERROR_CODES.CONFLICT;
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return ERROR_CODES.VALIDATION_ERROR;
      case HttpStatus.REQUEST_TIMEOUT:
        return ERROR_CODES.TIMEOUT;
      default:
        return status >= 500 ? ERROR_CODES.INTERNAL_ERROR : ERROR_CODES.BAD_REQUEST;
    }
  }
}
