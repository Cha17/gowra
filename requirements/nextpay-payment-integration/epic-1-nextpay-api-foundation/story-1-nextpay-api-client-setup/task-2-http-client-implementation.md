# Task 2: HTTP Client Implementation

Status: Pending

## Task Purpose

Implement a robust HTTP client wrapper that handles NextPay API requests with proper error handling, retry logic, and response processing.

## Implementation Details

### HTTP Client Interface

```typescript
// worker/src/lib/nextpay/http-client.ts
export interface NextPayHttpClient {
  get<T>(endpoint: string, options?: RequestOptions): Promise<T>;
  post<T>(endpoint: string, data?: any, options?: RequestOptions): Promise<T>;
  put<T>(endpoint: string, data?: any, options?: RequestOptions): Promise<T>;
  delete<T>(endpoint: string, options?: RequestOptions): Promise<T>;
}

export interface RequestOptions {
  timeout?: number;
  retryAttempts?: number;
  headers?: Record<string, string>;
}

export interface NextPayApiError {
  code: string;
  message: string;
  details?: any;
  statusCode: number;
}
```

### HTTP Client Implementation

```typescript
export class NextPayHttpClientImpl implements NextPayHttpClient {
  constructor(private config: NextPayConfig, private logger: Logger) {}

  async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.makeRequest<T>("GET", endpoint, undefined, options);
  }

  async post<T>(
    endpoint: string,
    data?: any,
    options?: RequestOptions
  ): Promise<T> {
    return this.makeRequest<T>("POST", endpoint, data, options);
  }

  private async makeRequest<T>(
    method: string,
    endpoint: string,
    data?: any,
    options?: RequestOptions
  ): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`;
    const headers = this.buildHeaders(options?.headers);

    const requestOptions: RequestInit = {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      signal: AbortSignal.timeout(options?.timeout || this.config.timeout),
    };

    return this.executeWithRetry(url, requestOptions, options?.retryAttempts);
  }

  private buildHeaders(
    customHeaders?: Record<string, string>
  ): Record<string, string> {
    const authHeader = this.buildAuthHeader();
    return {
      "Content-Type": "application/json",
      Authorization: authHeader,
      ...customHeaders,
    };
  }

  private buildAuthHeader(): string {
    const credentials = `${this.config.clientId}:${this.config.clientSecret}`;
    const encoded = btoa(credentials);
    return `Basic ${encoded}`;
  }
}
```

## Acceptance Criteria

- [ ] HTTP client supports all required HTTP methods
- [ ] Basic Auth header generated correctly
- [ ] Request timeout handling implemented
- [ ] Retry logic with exponential backoff
- [ ] Proper error handling and response parsing
- [ ] Comprehensive logging for debugging

## Testing Requirements

- [ ] HTTP methods work correctly
- [ ] Authentication header format is correct
- [ ] Timeout handling works as expected
- [ ] Retry logic functions properly
- [ ] Error responses are parsed correctly
- [ ] Logging captures all necessary information

## Files to Create/Modify

- `worker/src/lib/nextpay/http-client.ts` - HTTP client implementation
- `worker/src/lib/nextpay/errors.ts` - Error handling
- `worker/src/lib/nextpay/__tests__/http-client.test.ts` - Unit tests

## Dependencies

- Task 1: Environment Configuration Setup

## Notes

- Use AbortSignal for timeout handling
- Implement exponential backoff for retries
- Add comprehensive error logging
- Handle network errors gracefully
