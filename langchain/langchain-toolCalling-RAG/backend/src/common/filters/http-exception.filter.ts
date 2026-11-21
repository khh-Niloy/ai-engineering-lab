import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

export interface StructuredErrorResponse {
  success: boolean;
  statusCode: number;
  error: string;
  message: string | string[];
  path: string;
  method: string;
  timestamp: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error = 'Internal Server Error';
    let stack: string | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      stack = exception.stack;
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
        error = exception.name;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const resObj = exceptionResponse as Record<string, unknown>;

        if (
          typeof resObj.message === 'string' ||
          (Array.isArray(resObj.message) &&
            resObj.message.every((m) => typeof m === 'string'))
        ) {
          message = resObj.message;
        } else {
          message = exception.message || 'Error occurred';
        }

        if (typeof resObj.error === 'string') {
          error = resObj.error;
        } else {
          error = exception.name;
        }
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      error = exception.name;
      stack = exception.stack;
    }

    const errorResponse: StructuredErrorResponse = {
      success: false,
      statusCode: status,
      error,
      message,
      path: request.url,
      method: request.method,
      timestamp: new Date().toISOString(),
    };

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `[${request.method}] ${request.url} - ${status} - Error: ${
          Array.isArray(message) ? message.join(', ') : message
        }`,
        stack,
      );
    } else {
      this.logger.warn(
        `[${request.method}] ${request.url} - ${status} - Warning: ${
          Array.isArray(message) ? message.join(', ') : message
        }`,
      );
    }

    if (!response.headersSent) {
      response.status(status).json(errorResponse);
    }
  }
}

// Export alias for semantic clarity if used as AllExceptionsFilter
export { HttpExceptionFilter as AllExceptionsFilter };
