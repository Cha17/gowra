# Task 4: Error Handling & Retry Logic

Status: Pending

## Task Purpose

Implement comprehensive error handling and retry logic for NextPay API requests, ensuring robust operation under various failure conditions.

## Implementation Details

### Error Types and Handling

```typescript
// worker/src/lib/nextpay/errors.ts
export enum NextPayErrorType {
  NETWORK_ERROR = "NETWORK_ERROR",
  TIMEOUT_ERROR = "TIMEOUT_ERROR",
  AUTHENTICATION_ERROR = "AUTHENTICATION_ERROR",
  RATE_LIMIT_ERROR = "RATE_LIMIT_ERROR",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  SERVER_ERROR = "SERVER_ERROR",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

export class NextPayError extends Error {
  constructor(
    public type: NextPayErrorType,
    message: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = "NextPayError";
  }
}

export function createNextPayError(
  response: Response,
  body?: any
): NextPayError {
  const statusCode = response.status;

  switch (statusCode) {
    case 401:
      return new NextPayError(
        NextPayErrorType.AUTHENTICATION_ERROR,
        "Authentication failed",
        statusCode,
        body
      );
    case 429:
      return new NextPayError(
        NextPayErrorType.RATE_LIMIT_ERROR,
        "Rate limit exceeded",
        statusCode,
        body
      );
    case 400:
    case 422:
      return new NextPayError(
        NextPayErrorType.VALIDATION_ERROR,
        "Request validation failed",
        statusCode,
        body
      );
    case 500:
    case 502:
    case 503:
    case 504:
      return new NextPayError(
        NextPayErrorType.SERVER_ERROR,
        "Server error occurred",
        statusCode,
        body
      );
    default:
      return new NextPayError(
        NextPayErrorType.UNKNOWN_ERROR,
        "Unknown error occurred",
        statusCode,
        body
      );
  }
}
```

### Retry Logic Implementation

```typescript
// worker/src/lib/nextpay/retry.ts
export interface RetryOptions {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

export class RetryManager {
  constructor(private options: RetryOptions) {}

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    shouldRetry: (error: Error) => boolean
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= this.options.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        if (!shouldRetry(lastError) || attempt === this.options.maxAttempts) {
          throw lastError;
        }

        const delay = this.calculateDelay(attempt);
        await this.sleep(delay);
      }
    }

    throw lastError!;
  }

  private calculateDelay(attempt: number): number {
    const delay =
      this.options.baseDelay *
      Math.pow(this.options.backoffMultiplier, attempt - 1);
    return Math.min(delay, this.options.maxDelay);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export function shouldRetry(error: Error): boolean {
  if (error instanceof NextPayError) {
    switch (error.type) {
      case NextPayErrorType.NETWORK_ERROR:
      case NextPayErrorType.TIMEOUT_ERROR:
      case NextPayErrorType.RATE_LIMIT_ERROR:
      case NextPayErrorType.SERVER_ERROR:
        return true;
      case NextPayErrorType.AUTHENTICATION_ERROR:
      case NextPayErrorType.VALIDATION_ERROR:
        return false;
      default:
        return false;
    }
  }
  return false;
}
```

## Acceptance Criteria

- [ ] Comprehensive error types defined
- [ ] Retry logic with exponential backoff implemented
- [ ] Proper error classification and handling
- [ ] Network errors handled gracefully
- [ ] Rate limiting handled appropriately
- [ ] Authentication errors not retried
- [ ] Comprehensive logging for debugging

## Testing Requirements

- [ ] Error types correctly classified
- [ ] Retry logic works with exponential backoff
- [ ] Non-retryable errors fail immediately
- [ ] Network errors are retried appropriately
- [ ] Rate limiting handled correctly
- [ ] Error logging captures all necessary information

## Files to Create/Modify

- `worker/src/lib/nextpay/errors.ts` - Error handling
- `worker/src/lib/nextpay/retry.ts` - Retry logic
- `worker/src/lib/nextpay/__tests__/errors.test.ts` - Error tests
- `worker/src/lib/nextpay/__tests__/retry.test.ts` - Retry tests

## Dependencies

- Task 2: HTTP Client Implementation

## Notes

- Implement exponential backoff for retries
- Don't retry authentication errors
- Handle rate limiting with appropriate delays
- Add comprehensive error logging
- Consider implementing circuit breaker pattern
