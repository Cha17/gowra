# Story 1: NextPay API Client Setup

Status: Pending

## Story Purpose

Implement a robust NextPay API client in the Worker that handles authentication, request/response processing, and error handling. This client will serve as the foundation for all NextPay API interactions.

## Acceptance Criteria

- [ ] NextPay API client configured with proper authentication
- [ ] Basic Auth header created correctly using Client ID/Secret
- [ ] HTTP client with error handling and retry logic
- [ ] Environment variables properly configured
- [ ] Unit tests for all client operations

## Technical Specifications

### API Client Interface

```typescript
export interface NextPayClientConfig {
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  timeout?: number;
  retryAttempts?: number;
}

export interface NextPayClient {
  createAccount(accountData: CreateAccountRequest): Promise<AccountResponse>;
  createPaymentIntent(
    intentData: CreatePaymentIntentRequest
  ): Promise<PaymentIntentResponse>;
  getAccount(accountId: string): Promise<AccountResponse>;
  getPaymentIntent(intentId: string): Promise<PaymentIntentResponse>;
}
```

### Environment Variables

```typescript
// Required environment variables
NEXTAPI_BASE_URL: string;           // https://api.partners.nextpay.world
NEXTPAY_API_KEY: string;            // Client ID
NEXTPAY_SECRET_KEY: string;         // Client Secret
NEXTPAY_TIMEOUT?: number;           // Request timeout (default: 30000ms)
NEXTPAY_RETRY_ATTEMPTS?: number;    // Retry attempts (default: 3)
```

## Implementation Tasks

- **Task 1**: Environment Configuration Setup
- **Task 2**: HTTP Client Implementation
- **Task 3**: Authentication Header Generation
- **Task 4**: Error Handling & Retry Logic
- **Task 5**: Unit Testing

## Testing Requirements

### Unit Test Coverage

- Config loader returns expected values
- Authorization header is `Basic base64(clientId:clientSecret)`
- Error normalization returns typed errors for 4xx/5xx
- Retry logic works correctly for transient failures
- Timeout handling works as expected

### Integration Testing

- API client can authenticate with NextPay sandbox
- Basic API operations return expected responses
- Error scenarios are handled gracefully

## Dependencies

- **Requires**: NextPay sandbox credentials
- **Enables**: All subsequent payment stories

## Technical Notes

- Use fetch API with proper error handling
- Implement exponential backoff for retries
- Add comprehensive logging for debugging
- Handle rate limiting gracefully
