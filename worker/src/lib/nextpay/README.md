# NextPay API Integration

This module provides a complete integration with the NextPay Partners API for payment processing in the Gowra event management system.

## Features

- **Account Management**: Create and manage NextPay accounts
- **Payment Intent Creation**: Generate QR codes for PHP/QRPH payments
- **Robust Error Handling**: Comprehensive error classification and retry logic
- **Authentication**: Secure Basic Auth implementation
- **Logging**: Structured logging with sensitive data sanitization
- **Type Safety**: Full TypeScript support with comprehensive type definitions

## Quick Start

```typescript
import { createNextPayClient } from "./lib/nextpay";

// Create client instance
const client = createNextPayClient(env);

// Create an account
const account = await client.createAccount({
  name: "John Doe",
  email: "john@example.com",
  phone: "+1234567890",
});

// Create a payment intent
const paymentIntent = await client.createPaymentIntent({
  accountId: account.id,
  amount: 100.0,
  currency: "PHP",
  description: "Event registration",
  orderId: "order-123",
});

// Get QR code for payment
console.log(paymentIntent.qrCode); // Base64 encoded QR code
```

## API Endpoints

The integration provides the following API endpoints:

- `GET /api/nextpay/health` - Health check for NextPay integration
- `POST /api/nextpay/test-account` - Create test account
- `POST /api/nextpay/test-payment-intent` - Create test payment intent
- `GET /api/nextpay/account/:id` - Get account by ID
- `GET /api/nextpay/payment-intent/:id` - Get payment intent by ID

## Environment Variables

Required environment variables:

```bash
NEXTAPI_BASE_URL=https://api.partners.nextpay.world
NEXTPAY_API_KEY=your_client_id
NEXTPAY_SECRET_KEY=your_client_secret
```

Optional environment variables:

```bash
NEXTPAY_TIMEOUT=30000                    # Request timeout in ms
NEXTPAY_RETRY_ATTEMPTS=3                # Number of retry attempts
NEXTPAY_ACCOUNT_ID=your_account_id       # Default account ID
```

## Error Handling

The integration includes comprehensive error handling:

```typescript
import { NextPayError, NextPayErrorType, shouldRetry } from "./lib/nextpay";

try {
  const result = await client.createAccount(accountData);
} catch (error) {
  if (error instanceof NextPayError) {
    switch (error.type) {
      case NextPayErrorType.AUTHENTICATION_ERROR:
        // Handle auth errors
        break;
      case NextPayErrorType.RATE_LIMIT_ERROR:
        // Handle rate limiting
        break;
      case NextPayErrorType.VALIDATION_ERROR:
        // Handle validation errors
        break;
    }
  }
}
```

## Retry Logic

The client automatically retries failed requests with exponential backoff:

- **Retryable errors**: Network errors, timeouts, rate limits, server errors
- **Non-retryable errors**: Authentication errors, validation errors
- **Backoff strategy**: Exponential backoff with jitter
- **Max attempts**: Configurable (default: 3)

## Logging

Structured logging with sensitive data sanitization:

```typescript
import { NextPayLogger } from "./lib/nextpay";

const logger = new NextPayLogger("nextpay-client", "production");

logger.info("Account created", { accountId: "acc-123" });
logger.error("Payment failed", error, { orderId: "order-456" });
logger.performance("API call", 150, { endpoint: "/accounts" });
```

## Testing

Run the test suite:

```bash
npm test
```

Test coverage includes:

- Configuration validation
- Authentication header generation
- Error classification and handling
- Retry logic with exponential backoff
- HTTP client functionality

## Security

- **Credential Protection**: Sensitive data is never logged
- **Secure Headers**: Proper Basic Auth implementation
- **Input Validation**: All inputs are validated using Zod schemas
- **Error Sanitization**: Error messages are sanitized before logging

## Architecture

```
NextPayClient
├── NextPayHttpClient
│   ├── NextPayAuthenticator
│   ├── RetryManager
│   └── ErrorHandler
├── NextPayLogger
└── Configuration
```

## Dependencies

- **Zod**: Schema validation
- **Hono**: HTTP framework
- **Vitest**: Testing framework

## Contributing

When adding new features:

1. Add comprehensive type definitions
2. Include error handling
3. Add unit tests
4. Update documentation
5. Follow security best practices
