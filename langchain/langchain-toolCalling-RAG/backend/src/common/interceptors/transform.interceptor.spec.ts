import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';
import { ApiResponse, TransformInterceptor } from './transform.interceptor';

describe('TransformInterceptor', () => {
  let interceptor: TransformInterceptor<unknown>;
  let mockExecutionContext: ExecutionContext;
  let mockCallHandler: CallHandler<unknown>;
  let mockResponse: { statusCode: number; headersSent: boolean };

  beforeEach(() => {
    interceptor = new TransformInterceptor();
    mockResponse = {
      statusCode: 200,
      headersSent: false,
    };
    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: jest.fn().mockReturnValue(mockResponse),
      }),
      getType: jest.fn().mockReturnValue('http'),
    } as unknown as ExecutionContext;
  });

  it('should wrap primitive response data into structured format', (done) => {
    mockCallHandler = {
      handle: jest.fn().mockReturnValue(of('Hello World')),
    };

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      next: (result: ApiResponse<unknown>) => {
        expect(result).toMatchObject({
          success: true,
          statusCode: 200,
          message: 'Success',
          data: 'Hello World',
        });
        expect(result.timestamp).toBeDefined();
        done();
      },
    });
  });

  it('should preserve custom message when provided in object', (done) => {
    mockCallHandler = {
      handle: jest.fn().mockReturnValue(
        of({
          message: 'User created successfully',
          data: { id: 1, name: 'Alice' },
        }),
      ),
    };

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      next: (result: ApiResponse<unknown>) => {
        expect(result).toMatchObject({
          success: true,
          statusCode: 200,
          message: 'User created successfully',
          data: { id: 1, name: 'Alice' },
        });
        done();
      },
    });
  });
});
