import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Response } from 'express';

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiResponse<T>> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse<Response>();

    return next.handle().pipe(
      map((resData: T): ApiResponse<T> => {
        const statusCode = response.statusCode;

        let message = 'Success';
        let data: unknown = resData;

        if (resData && typeof resData === 'object' && !Array.isArray(resData)) {
          const record = resData as Record<string, unknown>;
          if (typeof record.message === 'string') {
            message = record.message;
          }
          if ('data' in record) {
            data = record.data;
          }
        }

        return {
          success: true,
          statusCode,
          message,
          data: data as T,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
