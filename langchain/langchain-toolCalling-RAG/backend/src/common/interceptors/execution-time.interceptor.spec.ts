import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';
import { ExecutionTimeInterceptor } from './execution-time.interceptor';

describe('ExecutionTimeInterceptor', () => {
  let interceptor: ExecutionTimeInterceptor;
  let mockExecutionContext: ExecutionContext;
  let mockCallHandler: CallHandler;
  let mockResponse: { setHeader: jest.Mock; headersSent: boolean };

  beforeEach(() => {
    interceptor = new ExecutionTimeInterceptor();
    mockResponse = {
      setHeader: jest.fn(),
      headersSent: false,
    };
    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: jest.fn().mockReturnValue(mockResponse),
      }),
      getType: jest.fn().mockReturnValue('http'),
    } as unknown as ExecutionContext;
  });

  it('should set X-Response-Time header on response', (done) => {
    mockCallHandler = {
      handle: jest.fn().mockReturnValue(of({ ok: true })),
    };

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      next: () => {
        expect(mockResponse.setHeader).toHaveBeenCalledWith(
          'X-Response-Time',
          expect.stringMatching(/^\d+(\.\d+)?ms$/),
        );
        done();
      },
    });
  });
});
