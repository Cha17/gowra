# Task 1: Environment Configuration Setup

Status: Pending

## Task Purpose

Set up environment variables and configuration management for NextPay API integration, ensuring secure credential handling and proper configuration validation.

## Implementation Details

### Environment Variables Setup

```typescript
// worker/src/schema/env.ts - Add NextPay configuration
export const EnvBindingSchema = z.object({
  // ... existing fields ...

  // NextPay API Configuration
  NEXTAPI_BASE_URL: z.string().url(),
  NEXTPAY_API_KEY: z.string().min(1),
  NEXTPAY_SECRET_KEY: z.string().min(1),
  NEXTPAY_TIMEOUT: z.number().min(1000).max(60000).optional().default(30000),
  NEXTPAY_RETRY_ATTEMPTS: z.number().min(1).max(10).optional().default(3),
  NEXTPAY_ACCOUNT_ID: z.string().optional(),
});
```

### Configuration Loader

```typescript
// worker/src/lib/nextpay/config.ts
export interface NextPayConfig {
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  timeout: number;
  retryAttempts: number;
  accountId?: string;
}

export function loadNextPayConfig(env: EnvBinding): NextPayConfig {
  return {
    baseUrl: env.NEXTAPI_BASE_URL,
    clientId: env.NEXTPAY_API_KEY,
    clientSecret: env.NEXTPAY_SECRET_KEY,
    timeout: env.NEXTPAY_TIMEOUT || 30000,
    retryAttempts: env.NEXTPAY_RETRY_ATTEMPTS || 3,
    accountId: env.NEXTPAY_ACCOUNT_ID,
  };
}
```

## Acceptance Criteria

- [ ] Environment variables properly defined in schema
- [ ] Configuration loader validates all required fields
- [ ] Default values set for optional parameters
- [ ] Type safety ensured for all configuration values
- [ ] Environment validation works correctly

## Testing Requirements

- [ ] Config loader returns expected values
- [ ] Validation fails for missing required fields
- [ ] Default values are applied correctly
- [ ] Invalid URLs are rejected
- [ ] Type safety is maintained

## Files to Create/Modify

- `worker/src/schema/env.ts` - Add NextPay environment variables
- `worker/src/lib/nextpay/config.ts` - Configuration loader
- `worker/src/lib/nextpay/types.ts` - Type definitions
- `worker/src/lib/nextpay/__tests__/config.test.ts` - Unit tests

## Dependencies

- None (foundational task)

## Notes

- Ensure all sensitive credentials are properly typed
- Add validation for URL format and credential length
- Consider adding environment-specific configurations
