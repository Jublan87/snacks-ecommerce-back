import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus, Logger } from '@nestjs/common';
import { Response } from 'express';
import { Prisma } from '@prisma/client';
import { ERROR_CODES } from '../constants/error-codes';
import { ErrorResponseBody } from './all-exceptions.filter';

/**
 * Mapeo de códigos de error de Prisma a HTTP status y código interno.
 * @see https://www.prisma.io/docs/orm/reference/error-reference
 */
const PRISMA_ERROR_MAP: Record<string, { statusCode: number; code: string }> = {
  P2002: { statusCode: HttpStatus.CONFLICT, code: ERROR_CODES.CONFLICT },
  P2003: { statusCode: HttpStatus.BAD_REQUEST, code: ERROR_CODES.DB_CONSTRAINT },
  P2025: { statusCode: HttpStatus.NOT_FOUND, code: ERROR_CODES.RECORD_NOT_FOUND },
  P2014: { statusCode: HttpStatus.BAD_REQUEST, code: ERROR_CODES.DB_CONSTRAINT },
  P2000: { statusCode: HttpStatus.BAD_REQUEST, code: ERROR_CODES.VALIDATION_ERROR },
  P2001: { statusCode: HttpStatus.NOT_FOUND, code: ERROR_CODES.RECORD_NOT_FOUND },
  P2016: { statusCode: HttpStatus.BAD_REQUEST, code: ERROR_CODES.DB_CONSTRAINT },
  P2018: { statusCode: HttpStatus.NOT_FOUND, code: ERROR_CODES.RECORD_NOT_FOUND },
  P2021: { statusCode: HttpStatus.INTERNAL_SERVER_ERROR, code: ERROR_CODES.INTERNAL_ERROR },
  P2022: { statusCode: HttpStatus.INTERNAL_SERVER_ERROR, code: ERROR_CODES.INTERNAL_ERROR },
};

/**
 * Filtro que captura excepciones de Prisma y las convierte en respuestas HTTP consistentes.
 * Se registra antes que AllExceptionsFilter para que Prisma tenga prioridad.
 */
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const mapping = PRISMA_ERROR_MAP[exception.code] ?? {
      statusCode: HttpStatus.BAD_REQUEST,
      code: ERROR_CODES.DB_CONSTRAINT,
    };

    const message = this.getUserMessage(exception, mapping.statusCode);
    const details = this.getSanitizedMeta(exception);

    const body: ErrorResponseBody = {
      success: false,
      error: {
        code: mapping.code as ErrorResponseBody['error']['code'],
        message,
        statusCode: mapping.statusCode,
        timestamp: new Date().toISOString(),
      },
    };

    if (details !== undefined) {
      body.error.details = details;
    }

    this.logger.warn(
      `Prisma error ${exception.code}: ${exception.message}`,
      exception.meta ? JSON.stringify(exception.meta) : undefined,
    );

    response.status(mapping.statusCode).json(body);
  }

  private getUserMessage(
    exception: Prisma.PrismaClientKnownRequestError,
    statusCode: number,
  ): string {
    switch (exception.code) {
      case 'P2002': {
        const target = exception.meta?.target as string[] | undefined;
        const fields = Array.isArray(target) ? target.join(', ') : 'registro';
        return `Ya existe un registro con el mismo valor en: ${fields}`;
      }
      case 'P2003':
        return 'La operación viola una restricción de integridad referencial.';
      case 'P2025':
        return 'El registro solicitado no existe o ya fue eliminado.';
      case 'P2014':
        return 'La relación requerida no se cumple.';
      default:
        return statusCode >= 500
          ? 'Error en la base de datos. Intente más tarde.'
          : exception.message;
    }
  }

  private getSanitizedMeta(
    exception: Prisma.PrismaClientKnownRequestError,
  ): Record<string, unknown> | undefined {
    if (!exception.meta || typeof exception.meta !== 'object') {
      return undefined;
    }
    return exception.meta as Record<string, unknown>;
  }
}
