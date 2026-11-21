import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const { method, originalUrl, ip } = request;
    const userAgent = request.get('user-agent') || 'Unknown';
    const startTime = Date.now();

    this.logger.log(
      `Incoming Request: [${method}] ${originalUrl} | IP: ${ip} | User-Agent: ${userAgent}`,
    );

    return next.handle().pipe(
      tap({
        next: () => {
          const { statusCode } = response;
          const duration = Date.now() - startTime;
          this.logger.log(
            `Outgoing Response: [${method}] ${originalUrl} | Status: ${statusCode} | Duration: ${duration}ms`,
          );
        },
        error: (error: unknown) => {
          const duration = Date.now() - startTime;
          let status = 500;
          let message = 'Internal Server Error';
          let stack: string | undefined;

          if (error instanceof HttpException) {
            status = error.getStatus();
            message = error.message;
            stack = error.stack;
          } else if (error instanceof Error) {
            message = error.message;
            stack = error.stack;
          }

          this.logger.error(
            `Request Failed: [${method}] ${originalUrl} | Status: ${status} | Duration: ${duration}ms | Error: ${message}`,
            stack,
          );
        },
      }),
    );
  }
}
