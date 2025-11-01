# Task 5: Unit Testing

Status: Pending

## Task Purpose

Implement comprehensive unit tests for the NextPay API client, ensuring all functionality works correctly and edge cases are handled properly.

## Implementation Details

### Test Structure

```typescript
// worker/src/lib/nextpay/__tests__/config.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { loadNextPayConfig } from "../config";
import type { EnvBinding } from "../../schema/env";

describe("NextPay Config", () => {
  let mockEnv: EnvBinding;

  beforeEach(() => {
    mockEnv = {
      NEXTAPI_BASE_URL: "https://api.partners.nextpay.world",
      NEXTPAY_API_KEY: "test-client-id",
      NEXTPAY_SECRET_KEY: "test-client-secret",
      NEXTPAY_TIMEOUT: 30000,
      NEXTPAY_RETRY_ATTEMPTS: 3,
      NEXTPAY_ACCOUNT_ID: "test-account-id",
      // ... other required fields
    } as EnvBinding;
  });

  it("should load configuration correctly", () => {
    const config = loadNextPayConfig(mockEnv);

    expect(config.baseUrl).toBe("https://api.partners.nextpay.world");
    expect(config.clientId).toBe("test-client-id");
    expect(config.clientSecret).toBe("test-client-secret");
    expect(config.timeout).toBe(30000);
    expect(config.retryAttempts).toBe(3);
    expect(config.accountId).toBe("test-account-id");
  });

  it("should use default values for optional fields", () => {
    const envWithoutDefaults = {
      ...mockEnv,
      NEXTPAY_TIMEOUT: undefined,
      NEXTPAY_RETRY_ATTEMPTS: undefined,
    } as EnvBinding;

    const config = loadNextPayConfig(envWithoutDefaults);

    expect(config.timeout).toBe(30000);
    expect(config.retryAttempts).toBe(3);
  });

  it("should validate required fields", () => {
    const invalidEnv = {
      ...mockEnv,
      NEXTAPI_BASE_URL: "",
      NEXTPAY_API_KEY: "",
    } as EnvBinding;

    expect(() => loadNextPayConfig(invalidEnv)).toThrow();
  });
});
```

### HTTP Client Tests

```typescript
// worker/src/lib/nextpay/__tests__/http-client.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextPayHttpClientImpl } from "../http-client";
import type { NextPayConfig } from "../config";

describe("NextPay HTTP Client", () => {
  let client: NextPayHttpClientImpl;
  let mockConfig: NextPayConfig;
  let mockLogger: any;

  beforeEach(() => {
    mockConfig = {
      baseUrl: "https://api.partners.nextpay.world",
      clientId: "test-client-id",
      clientSecret: "test-client-secret",
      timeout: 30000,
      retryAttempts: 3,
    };

    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
    };

    client = new NextPayHttpClientImpl(mockConfig, mockLogger);
  });

  it("should generate correct auth header", () => {
    const authHeader = client["buildAuthHeader"]();
    const expected = `Basic ${btoa("test-client-id:test-client-secret")}`;
    expect(authHeader).toBe(expected);
  });

  it("should handle successful requests", async () => {
    const mockResponse = { data: "test" };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await client.get("/test");
    expect(result).toEqual(mockResponse);
  });

  it("should handle authentication errors", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ error: "Unauthorized" }),
    });

    await expect(client.get("/test")).rejects.toThrow("Authentication failed");
  });

  it("should retry on network errors", async () => {
    let callCount = 0;
    global.fetch = vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount < 3) {
        throw new Error("Network error");
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: "success" }),
      });
    });

    const result = await client.get("/test");
    expect(result).toEqual({ data: "success" });
    expect(callCount).toBe(3);
  });
});
```

## Acceptance Criteria

- [ ] All configuration functions tested
- [ ] HTTP client methods tested
- [ ] Authentication header generation tested
- [ ] Error handling scenarios tested
- [ ] Retry logic tested
- [ ] Edge cases covered
- [ ] Test coverage > 90%

## Testing Requirements

### Unit Tests

- [ ] Configuration loading and validation
- [ ] HTTP client request/response handling
- [ ] Authentication header generation
- [ ] Error classification and handling
- [ ] Retry logic with exponential backoff
- [ ] Timeout handling
- [ ] Network error scenarios

### Integration Tests

- [ ] End-to-end API client functionality
- [ ] Real API calls with sandbox credentials
- [ ] Error response handling
- [ ] Performance under load

## Files to Create/Modify

- `worker/src/lib/nextpay/__tests__/config.test.ts`
- `worker/src/lib/nextpay/__tests__/http-client.test.ts`
- `worker/src/lib/nextpay/__tests__/auth.test.ts`
- `worker/src/lib/nextpay/__tests__/errors.test.ts`
- `worker/src/lib/nextpay/__tests__/retry.test.ts`
- `worker/src/lib/nextpay/__tests__/integration.test.ts`

## Dependencies

- All previous tasks in Story 1

## Notes

- Use Vitest for testing framework
- Mock external dependencies
- Test both success and failure scenarios
- Include performance tests
- Add integration tests with sandbox API
