import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Response } from 'express';

@Injectable()
export class ExecutionTimeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const startTime = process.hrtime.bigint();
    const ctx = context.switchToHttp();
    const response = ctx.getResponse<Response>();

    return next.handle().pipe(
      tap(() => {
        const endTime = process.hrtime.bigint();
        const durationInMs = Number(endTime - startTime) / 1_000_000;
        const formattedDuration = `${durationInMs.toFixed(2)}ms`;

        if (!response.headersSent) {
          response.setHeader('X-Response-Time', formattedDuration);
        }
      }),
    );
  }
}
