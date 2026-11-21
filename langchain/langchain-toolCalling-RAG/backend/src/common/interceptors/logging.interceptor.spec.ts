import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { LoggingInterceptor } from './logging.interceptor';

describe('LoggingInterceptor', () => {
  let interceptor: LoggingInterceptor;
  let mockExecutionContext: ExecutionContext;
  let mockCallHandler: CallHandler;
  let mockRequest: {
    method: string;
    originalUrl: string;
    ip: string;
    get: jest.Mock;
  };
  let mockResponse: { statusCode: number };

  beforeEach(() => {
    interceptor = new LoggingInterceptor();
    mockRequest = {
      method: 'GET',
      originalUrl: '/test',
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('test-agent'),
    };
    mockResponse = {
      statusCode: 200,
    };
    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
        getResponse: jest.fn().mockReturnValue(mockResponse),
      }),
      getType: jest.fn().mockReturnValue('http'),
    } as unknown as ExecutionContext;
  });

  it('should log incoming and outgoing requests on success', (done) => {
    mockCallHandler = {
      handle: jest.fn().mockReturnValue(of({ data: 'ok' })),
    };

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      next: (val) => {
        expect(val).toEqual({ data: 'ok' });
        done();
      },
    });
  });

  it('should handle error in pipeline and rethrow', (done) => {
    const error = new Error('Something went wrong');
    mockCallHandler = {
      handle: jest.fn().mockReturnValue(throwError(() => error)),
    };

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      error: (err) => {
        expect(err).toBe(error);
        done();
      },
    });
  });
});
